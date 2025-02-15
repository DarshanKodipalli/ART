/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package signature.validation;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.security.cert.CertificateEncodingException;
import java.security.cert.X509CRL;
import java.security.cert.X509Certificate;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.pdfbox.cos.COSArray;
import org.apache.pdfbox.cos.COSBase;
import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.cos.COSStream;
import org.apache.pdfbox.cos.COSUpdateInfo;
import signature.SigUtils;
import signature.cert.CRLVerifier;
import signature.cert.CertificateVerificationException;
import signature.cert.OcspHelper;
import signature.cert.RevokedCertificateException;
import signature.validation.CertInformationCollector.CertSignatureInformation;
import org.apache.pdfbox.io.IOUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.encryption.SecurityProvider;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.bouncycastle.cert.ocsp.BasicOCSPResp;
import org.bouncycastle.cert.ocsp.OCSPException;
import org.bouncycastle.cert.ocsp.OCSPResp;

/**
 * An example for adding Validation Information to a signed PDF, inspired by ETSI TS 102 778-4
 * V1.1.2 (2009-12), Part 4: PAdES Long Term - PAdES-LTV Profile. This procedure appends the
 * Validation Information of the last signature (more precise its signer(s)) to a copy of the
 * document. The signature and the signed data will not be touched and stay valid.
 *
 * @author Alexis Suter
 */
public class AddValidationInformation
{
    private static final Log LOG = LogFactory.getLog(AddValidationInformation.class);

    private CertInformationCollector certInformationHelper;
    private COSArray correspondingOCSPs;
    private COSArray correspondingCRLs;
    private COSDictionary vriBase;
    private COSArray ocsps;
    private COSArray crls;
    private COSArray certs;
    private PDDocument document;
    private final Set<BigInteger> foundRevocationInformation = new HashSet<BigInteger>();
    private Calendar signDate;

    /**
     * Signs the given PDF file.
     * 
     * @param inFile input PDF file
     * @param outFile output PDF file
     * @throws IOException if the input file could not be read
     */
    public void validateSignature(File inFile, File outFile) throws IOException
    {
        if (inFile == null || !inFile.exists())
        {
            throw new FileNotFoundException("Document for signing does not exist");
        }

        PDDocument doc = PDDocument.load(inFile);
        FileOutputStream fos = new FileOutputStream(outFile);
        document = doc;
        doValidation(inFile.getAbsolutePath(), fos);
        fos.close();
        doc.close();
    }

    /**
     * Fetches certificate information from the last signature of the document and appends a DSS
     * with the validation information to the document.
     *
     * @param document containing the Signature
     * @param filename in file to extract signature
     * @param output where to write the changed document
     * @throws IOException
     */
    private void doValidation(String filename, OutputStream output) throws IOException
    {
        certInformationHelper = new CertInformationCollector();
        CertSignatureInformation certInfo = null;
        try
        {
            PDSignature signature = SigUtils.getLastRelevantSignature(document);
            if (signature != null)
            {
                certInfo = certInformationHelper.getLastCertInfo(signature, filename);
                signDate = signature.getSignDate();
            }
        }
        catch (CertificateProccessingException e)
        {
            throw new IOException("An Error occurred processing the Signature", e);
        }
        if (certInfo == null)
        {
            throw new IOException(
                    "No Certificate information or signature found in the given document");
        }

        PDDocumentCatalog docCatalog = document.getDocumentCatalog();
        COSDictionary catalog = docCatalog.getCOSObject();
        catalog.setNeedToBeUpdated(true);

        COSDictionary dss = getOrCreateDictionaryEntry(COSDictionary.class, catalog, "DSS");

        addExtensions(docCatalog);

        vriBase = getOrCreateDictionaryEntry(COSDictionary.class, dss, "VRI");

        ocsps = getOrCreateDictionaryEntry(COSArray.class, dss, "OCSPs");

        crls = getOrCreateDictionaryEntry(COSArray.class, dss, "CRLs");

        certs = getOrCreateDictionaryEntry(COSArray.class, dss, "Certs");

        addRevocationData(certInfo);

        addAllCertsToCertArray();

        // write incremental
        document.saveIncremental(output);
    }

    /**
     * Gets or creates a dictionary entry. If existing checks for the type and sets need to be
     * updated.
     *
     * @param clazz the class of the dictionary entry, must implement COSUpdateInfo
     * @param parent where to find the element
     * @param name of the element
     * @return a Element of given class, new or existing
     * @throws IOException when the type of the element is wrong
     */
    private static <T extends COSBase & COSUpdateInfo> T getOrCreateDictionaryEntry(Class<T> clazz,
            COSDictionary parent, String name) throws IOException
    {
        T result;
        COSBase element = parent.getDictionaryObject(name);
        if (element != null && clazz.isInstance(element))
        {
            result = clazz.cast(element);
            result.setNeedToBeUpdated(true);
        }
        else if (element != null)
        {
            throw new IOException("Element " + name + " from dictionary is not of type "
                    + clazz.getCanonicalName());
        }
        else
        {
            try
            {
                result = clazz.newInstance();
            }
            catch (InstantiationException e)
            {
                LOG.error("Failed to create new instance of " + clazz.getCanonicalName(), e);
                return null;
            }
            catch (IllegalAccessException e)
            {
                LOG.error("Failed to create new instance of " + clazz.getCanonicalName(), e);
                return null;
            }
            result.setDirect(false);
            parent.setItem(COSName.getPDFName(name), result);
        }
        return result;
    }

    /**
     * Fetches and adds revocation information based on the certInfo to the DSS.
     *
     * @param certInfo Certificate information from CertInformationHelper containing certificate
     * chains.
     * @throws IOException
     */
    private void addRevocationData(CertSignatureInformation certInfo) throws IOException
    {
        COSDictionary vri = new COSDictionary();
        vriBase.setItem(certInfo.getSignatureHash(), vri);

        correspondingOCSPs = new COSArray();
        correspondingCRLs = new COSArray();

        addRevocationDataRecursive(certInfo);

        if (correspondingOCSPs.size() > 0)
        {
            vri.setItem("OCSP", correspondingOCSPs);
        }
        if (correspondingCRLs.size() > 0)
        {
            vri.setItem("CRL", correspondingCRLs);
        }

        if (certInfo.getTsaCerts() != null)
        {
            // Don't add RevocationInfo from tsa to VRI's
            correspondingOCSPs = null;
            correspondingCRLs = null;
            addRevocationDataRecursive(certInfo.getTsaCerts());
        }
    }

    /**
     * Tries to get Revocation Data (first OCSP, else CRL) from the given Certificate Chain.
     *
     * @param certInfo from which to fetch revocation data. Will work recursively through its
     * chains.
     * @throws IOException when failed to fetch an revocation data.
     */
    private void addRevocationDataRecursive(CertSignatureInformation certInfo) throws IOException
    {
        if (certInfo.isSelfSigned())
        {
            return;
        }
        // To avoid getting same revocation information twice.
        boolean isRevocationInfoFound = foundRevocationInformation
                .contains(certInfo.getCertificate().getSerialNumber());
        if (!isRevocationInfoFound)
        {
            if (certInfo.getOcspUrl() != null && certInfo.getIssuerCertificate() != null)
            {
                isRevocationInfoFound = fetchOcspData(certInfo);
            }
            if (!isRevocationInfoFound && certInfo.getCrlUrl() != null)
            {
                fetchCrlData(certInfo);
                isRevocationInfoFound = true;
            }

            if (certInfo.getOcspUrl() == null && certInfo.getCrlUrl() == null)
            {
                LOG.info("No revocation information for cert " + certInfo.getCertificate().getSubjectX500Principal());
            }
            else if (!isRevocationInfoFound)
            {
                throw new IOException("Could not fetch Revocation Info for Cert: "
                        + certInfo.getCertificate().getSubjectX500Principal());
            }
        }

        if (certInfo.getAlternativeCertChain() != null)
        {
            addRevocationDataRecursive(certInfo.getAlternativeCertChain());
        }

        if (certInfo.getCertChain() != null && certInfo.getCertChain().getCertificate() != null)
        {
            addRevocationDataRecursive(certInfo.getCertChain());
        }
    }

    /**
     * Tries to fetch and add OCSP Data to its containers.
     *
     * @param certInfo the certificate info, for it to check OCSP data.
     * @return true when the OCSP data has successfully been fetched and added
     * @throws IOException when Certificate is revoked.
     */
    private boolean fetchOcspData(CertSignatureInformation certInfo) throws IOException
    {
        try
        {
            addOcspData(certInfo);
            return true;
        }
        catch (OCSPException e)
        {
            LOG.warn("Failed fetching Ocsp", e);
            return false;
        }
        catch (CertificateProccessingException e)
        {
            LOG.warn("Failed fetching Ocsp", e);
            return false;
        }
        catch (IOException e)
        {
            LOG.warn("Failed fetching Ocsp", e);
            return false;
        }
        catch (RevokedCertificateException e)
        {
            throw new IOException(e);
        }
    }

    /**
     * Tries to fetch and add CRL Data to its containers.
     *
     * @param certInfo the certificate info, for it to check CRL data.
     * @throws IOException when failed to fetch, because no validation data could be fetched for
     * data.
     */
    private void fetchCrlData(CertSignatureInformation certInfo) throws IOException
    {
        try
        {
            addCrlRevocationInfo(certInfo);
        }
        catch (GeneralSecurityException e)
        {
            LOG.warn("Failed fetching CRL", e);
            throw new IOException(e);
        }
        catch (RevokedCertificateException e)
        {
            LOG.warn("Failed fetching CRL", e);
            throw new IOException(e);
        }
        catch (IOException e)
        {
            LOG.warn("Failed fetching CRL", e);
            throw new IOException(e);
        }
        catch (CertificateVerificationException e)
        {
            LOG.warn("Failed fetching CRL", e);
            throw new IOException(e);
        }
    }

    /**
     * Fetches and adds OCSP data to storage for the given Certificate.
     * 
     * @param certInfo the certificate info, for it to check OCSP data.
     * @throws IOException
     * @throws OCSPException
     * @throws CertificateProccessingException
     * @throws RevokedCertificateException
     */
    private void addOcspData(CertSignatureInformation certInfo) throws IOException, OCSPException,
            CertificateProccessingException, RevokedCertificateException
    {
        OcspHelper ocspHelper = new OcspHelper(
                certInfo.getCertificate(),
                signDate.getTime(),
                certInfo.getIssuerCertificate(),
                new HashSet<X509Certificate>(certInformationHelper.getCertificatesMap().values()),
                certInfo.getOcspUrl());

        OCSPResp ocspResp = ocspHelper.getResponseOcsp();
        BasicOCSPResp basicResponse = (BasicOCSPResp) ocspResp.getResponseObject();
        certInformationHelper.addAllCertsFromHolders(basicResponse.getCerts());
        
        //TODO check revocation of responder + include in separate VRI (usually not needed). 
        // See comment by mkl in PDFBOX-3017 on 21.11.2018

        byte[] ocspData = ocspResp.getEncoded();

        COSStream ocspStream = writeDataToStream(ocspData);
        ocsps.add(ocspStream);
        if (correspondingOCSPs != null)
        {
            correspondingOCSPs.add(ocspStream);
        }
        foundRevocationInformation.add(certInfo.getCertificate().getSerialNumber());
    }

    /**
     * Fetches and adds CRL data to storage for the given Certificate.
     * 
     * @param certInfo the certificate info, for it to check CRL data.
     * @throws IOException
     * @throws RevokedCertificateException
     * @throws GeneralSecurityException
     * @throws CertificateVerificationException 
     */
    private void addCrlRevocationInfo(CertSignatureInformation certInfo)
            throws IOException, RevokedCertificateException, GeneralSecurityException,
            CertificateVerificationException
    {
        X509CRL crl = CRLVerifier.downloadCRLFromWeb(certInfo.getCrlUrl());
        crl.verify(certInfo.getIssuerCertificate().getPublicKey(), SecurityProvider.getProvider().getName());
        CRLVerifier.checkRevocation(crl, certInfo.getCertificate(), signDate.getTime(), certInfo.getCrlUrl());
        COSStream crlStream = writeDataToStream(crl.getEncoded());
        crls.add(crlStream);
        if (correspondingCRLs != null)
        {
            correspondingCRLs.add(crlStream);
        }
        foundRevocationInformation.add(certInfo.getCertificate().getSerialNumber());
    }

    /**
     * Adds all certs to the certs-array. Make sure, all certificates are inside the
     * certificateStore of certInformationHelper
     *
     * @throws IOException
     */
    private void addAllCertsToCertArray() throws IOException
    {
        try
        {
            for (X509Certificate cert : certInformationHelper.getCertificatesMap().values())
            {
                COSStream stream = writeDataToStream(cert.getEncoded());
                certs.add(stream);
            }
        }
        catch (CertificateEncodingException e)
        {
            throw new IOException(e);
        }
    }

    /**
     * Creates a Flate encoded <code>COSStream</code> object with the given data.
     * 
     * @param data to write into the COSStream
     * @return COSStream a COSStream object that can be added to the document
     * @throws IOException
     */
    private COSStream writeDataToStream(byte[] data) throws IOException
    {
        COSStream stream = document.getDocument().createCOSStream();
        OutputStream os = null;
        try
        {
            os = stream.createOutputStream(COSName.FLATE_DECODE);
            os.write(data);
        }
        finally
        {
            IOUtils.closeQuietly(os);
        }
        return stream;
    }

    /**
     * Adds Extensions to the document catalog. So that the use of DSS is identified. Described in
     * PAdES Part 4, Chapter 4.4.
     *
     * @param catalog to add Extensions into
     */
    private void addExtensions(PDDocumentCatalog catalog)
    {
        COSDictionary dssExtensions = new COSDictionary();
        dssExtensions.setDirect(true);
        catalog.getCOSObject().setItem("Extensions", dssExtensions);

        COSDictionary adbeExtension = new COSDictionary();
        adbeExtension.setDirect(true);
        dssExtensions.setItem("ADBE", adbeExtension);

        adbeExtension.setName("BaseVersion", "1.7");
        adbeExtension.setInt("ExtensionLevel", 5);

        catalog.setVersion("1.7");
    }

    public static void main(String[] args) throws IOException, GeneralSecurityException
    {
        if (args.length != 1)
        {
            usage();
            System.exit(1);
        }

        // register BouncyCastle provider, needed for "exotic" algorithms
        Security.addProvider(SecurityProvider.getProvider());

        // add ocspInformation
        AddValidationInformation addOcspInformation = new AddValidationInformation();

        File inFile = new File(args[0]);
        String name = inFile.getName();
        String substring = name.substring(0, name.lastIndexOf('.'));

        File outFile = new File(inFile.getParent(), substring + "_ocsp.pdf");
        addOcspInformation.validateSignature(inFile, outFile);
    }

    private static void usage()
    {
        System.err.println("usage: java " + AddValidationInformation.class.getName() + " "
                + "<pdf_to_add_ocsp>\n");
    }
}
