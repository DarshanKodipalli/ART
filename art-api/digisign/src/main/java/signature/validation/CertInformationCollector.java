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

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.net.URL;
import java.security.GeneralSecurityException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.SignatureException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import signature.cert.CertificateVerifier;
import org.apache.pdfbox.io.IOUtils;
import org.apache.pdfbox.pdmodel.encryption.SecurityProvider;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.bouncycastle.asn1.DERSequence;
import org.bouncycastle.asn1.DERSet;
import org.bouncycastle.asn1.cms.Attribute;
import org.bouncycastle.asn1.cms.AttributeTable;
import org.bouncycastle.asn1.pkcs.PKCSObjectIdentifiers;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cms.CMSException;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.SignerInformation;
import org.bouncycastle.tsp.TSPException;
import org.bouncycastle.tsp.TimeStampToken;
import org.bouncycastle.util.Selector;
import org.bouncycastle.util.Store;

/**
 * This Class helps to extract Data/Information from a signature. The information is held in
 * CertSignatureInformation. Some information is needed for validation processing of the
 * participating certificates.
 *
 * @author Alexis Suter
 *
 */
public class CertInformationCollector
{
    private static final Log LOG = LogFactory.getLog(CertInformationCollector.class);

    private static final int MAX_CERTIFICATE_CHAIN_DEPTH = 5;

    private final Map<BigInteger, X509Certificate> certificatesMap = new HashMap<BigInteger, X509Certificate>();

    private final JcaX509CertificateConverter certConverter = new JcaX509CertificateConverter();

    private CertSignatureInformation rootCertInfo;

    /**
     * Gets the certificate information of a signature.
     * 
     * @param signature the signature of the document.
     * @param fileName of the document.
     * @return the CertSignatureInformation containing all certificate information
     * @throws CertificateProccessingException when there is an error processing the certificates
     * @throws IOException on a data processing error
     */
    public CertSignatureInformation getLastCertInfo(PDSignature signature, String fileName)
            throws CertificateProccessingException, IOException
    {
        FileInputStream documentInput = null;
        try
        {
            documentInput = new FileInputStream(fileName);
            byte[] signatureContent = signature.getContents(documentInput);
            return getCertInfo(signatureContent);
        }
        finally
        {
            IOUtils.closeQuietly(documentInput);
        }
    }

    /**
     * Processes one signature and its including certificates.
     *
     * @param signatureContent the byte[]-Content of the signature
     * @return the CertSignatureInformation for this signature
     * @throws IOException
     * @throws CertificateProccessingException
     */
    private CertSignatureInformation getCertInfo(byte[] signatureContent)
            throws CertificateProccessingException, IOException
    {
        rootCertInfo = new CertSignatureInformation();

        rootCertInfo.signatureHash = CertInformationHelper.getSha1Hash(signatureContent);

        try
        {
            CMSSignedData signedData = new CMSSignedData(signatureContent);
            Store<X509CertificateHolder> certificatesStore = signedData.getCertificates();

            SignerInformation signerInformation = processSignerStore(certificatesStore, signedData,
                    rootCertInfo);

            addTimestampCerts(signerInformation);
        }
        catch (CMSException e)
        {
            LOG.error("Error occurred getting Certificate Information from Signature", e);
            throw new CertificateProccessingException(e);
        }
        return rootCertInfo;
    }

    /**
     * Processes an embedded signed timestamp, that has been placed into a signature. The
     * certificates and its chain(s) will be processed the same way as the signature itself.
     *
     * @param signerInformation of the signature, to get unsigned attributes from it.
     * @throws IOException
     * @throws CertificateProccessingException
     */
    private void addTimestampCerts(SignerInformation signerInformation)
            throws IOException, CertificateProccessingException
    {
        AttributeTable unsignedAttributes = signerInformation.getUnsignedAttributes();
        if (unsignedAttributes == null)
        {
            return;
        }
        Attribute tsAttribute = signerInformation.getUnsignedAttributes()
                .get(PKCSObjectIdentifiers.id_aa_signatureTimeStampToken);
        if (tsAttribute.getAttrValues() instanceof DERSet)
        {
            DERSet tsSet = (DERSet) tsAttribute.getAttrValues();
            tsSet.getEncoded("DER");
            DERSequence tsSeq = (DERSequence) tsSet.getObjectAt(0);

            try
            {
                TimeStampToken tsToken = new TimeStampToken(
                        new CMSSignedData(tsSeq.getEncoded("DER")));

                rootCertInfo.tsaCerts = new CertSignatureInformation();

                @SuppressWarnings("unchecked")
                Store<X509CertificateHolder> certificatesStore = tsToken.getCertificates();

                processSignerStore(certificatesStore, tsToken.toCMSSignedData(),
                        rootCertInfo.tsaCerts);
            }
            catch (TSPException e)
            {
                throw new IOException("Error parsing timestamp token", e);
            }
            catch (CMSException e)
            {
                throw new IOException("Error parsing timestamp token", e);
            }
        }
    }

    /**
     * Processes a signer store and goes through the signers certificate-chain. Adds the found data
     * to the certInfo. Handles only the first signer, although multiple would be possible, but is
     * not yet practicable.
     *
     * @param certificatesStore To get the certificate information from. Certificates will be saved
     * in certificatesMap.
     * @param signedData data from which to get the SignerInformation
     * @param certInfo where to add certificate information
     * @return Signer Information of the processed certificatesStore for further usage.
     * @throws IOException on data-processing error
     * @throws CertificateProccessingException on a specific error with a certificate
     */
    private SignerInformation processSignerStore(Store<X509CertificateHolder> certificatesStore,
            CMSSignedData signedData, CertSignatureInformation certInfo)
            throws IOException, CertificateProccessingException
    {
        Collection<SignerInformation> signers = signedData.getSignerInfos().getSigners();
        SignerInformation signerInformation = signers.iterator().next();

        @SuppressWarnings("unchecked")
        Collection<X509CertificateHolder> matches = certificatesStore
                .getMatches((Selector<X509CertificateHolder>) signerInformation.getSID());

        X509Certificate certificate = getCertFromHolder(matches.iterator().next());

        Collection<X509CertificateHolder> allCerts = certificatesStore.getMatches(null);
        addAllCerts(allCerts);
        traverseChain(certificate, certInfo, MAX_CERTIFICATE_CHAIN_DEPTH);
        return signerInformation;
    }

    /**
     * Traverse through the Cert-Chain of the given Certificate and add it to the CertInfo
     * recursively.
     *
     * @param certificate Actual Certificate to be processed
     * @param certInfo where to add the Certificate (and chain) information
     * @param maxDepth Max depth from this point to go through CertChain (could be infinite)
     * @throws IOException on data-processing error
     * @throws CertificateProccessingException on a specific error with a certificate
     */
    private void traverseChain(X509Certificate certificate, CertSignatureInformation certInfo,
            int maxDepth) throws IOException, CertificateProccessingException
    {
        certInfo.certificate = certificate;

        // Certificate Authority Information Access
        // As described in https://tools.ietf.org/html/rfc3280.html#section-4.2.2.1
        byte[] authorityExtensionValue = certificate.getExtensionValue(Extension.authorityInfoAccess.getId());
        if (authorityExtensionValue != null)
        {
            CertInformationHelper.getAuthorityInfoExtensionValue(authorityExtensionValue, certInfo);
        }

        if (certInfo.issuerUrl != null)
        {
            getAlternativeIssuerCertificate(certInfo, maxDepth);
        }

        // As described in https://tools.ietf.org/html/rfc3280.html#section-4.2.1.14
        byte[] crlExtensionValue = certificate.getExtensionValue(Extension.cRLDistributionPoints.getId());
        if (crlExtensionValue != null)
        {
            certInfo.crlUrl = CertInformationHelper.getCrlUrlFromExtensionValue(crlExtensionValue);
        }

        try
        {
            certInfo.isSelfSigned = CertificateVerifier.isSelfSigned(certificate);
        }
        catch (GeneralSecurityException ex)
        {
            throw new CertificateProccessingException(ex);
        }
        if (maxDepth <= 0 || certInfo.isSelfSigned)
        {
            return;
        }

        for (X509Certificate issuer : certificatesMap.values())
        {
            if (certificate.getIssuerX500Principal().equals(issuer.getSubjectX500Principal()))
            {
                try
                {
                    certificate.verify(issuer.getPublicKey(), SecurityProvider.getProvider().getName());
                }
                catch (CertificateException ex)
                {
                    throw new CertificateProccessingException(ex);
                }
                catch (NoSuchAlgorithmException ex)
                {
                    throw new CertificateProccessingException(ex);
                }
                catch (InvalidKeyException ex)
                {
                    throw new CertificateProccessingException(ex);
                }
                catch (SignatureException ex)
                {
                    throw new CertificateProccessingException(ex);
                }
                catch (NoSuchProviderException ex)
                {
                    throw new CertificateProccessingException(ex);
                }
                LOG.info("Found the right Issuer Cert! for Cert: " + certificate.getSubjectX500Principal()
                        + "\n" + issuer.getSubjectX500Principal());
                certInfo.issuerCertificate = issuer;
                certInfo.certChain = new CertSignatureInformation();
                traverseChain(issuer, certInfo.certChain, maxDepth - 1);
                break;
            }
        }
        if (certInfo.issuerCertificate == null)
        {
            throw new IOException(
                    "No Issuer Certificate found for Cert: " + certificate.getSubjectX500Principal());
        }
    }

    /**
     * Get alternative certificate chain, from the Authority Information (a url). If the chain is
     * not included in the signature, this is the main chain. Otherwise there might be a second
     * chain. Exceptions which happen on this chain will be logged and ignored, because the cert
     * might not be available at the time or other reasons.
     *
     * @param certInfo base Certificate Information, on which to put the alternative Certificate
     * @param maxDepth Maximum depth to dig through the chain from here on.
     * @throws CertificateProccessingException on a specific error with a certificate
     */
    private void getAlternativeIssuerCertificate(CertSignatureInformation certInfo, int maxDepth)
            throws CertificateProccessingException
    {
        LOG.info("Get alternative issuer certificate from: " + certInfo.issuerUrl);
        try
        {
            URL certUrl = new URL(certInfo.issuerUrl);
            CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
            InputStream in = certUrl.openStream();

            X509Certificate altIssuerCert = (X509Certificate) certFactory.generateCertificate(in);
            addCertToCertificatesMap(altIssuerCert);

            certInfo.alternativeCertChain = new CertSignatureInformation();
            traverseChain(altIssuerCert, certInfo.alternativeCertChain, maxDepth - 1);
            in.close();
        }
        catch (IOException e)
        {
            LOG.error("Error getting alternative issuer certificate from " + certInfo.issuerUrl, e);
        }
        catch (CertificateException e)
        {
            LOG.error("Error getting alternative issuer certificate from " + certInfo.issuerUrl, e);
        }
    }

    /**
     * Adds the given Certificate to the certificatesMap, if not yet containing.
     * 
     * @param certificate to add to the certificatesMap
     */
    private void addCertToCertificatesMap(X509Certificate certificate)
    {
        if (!certificatesMap.containsKey(certificate.getSerialNumber()))
        {
            certificatesMap.put(certificate.getSerialNumber(), certificate);
        }
    }

    /**
     * Gets the X509Certificate out of the X509CertificateHolder and add it to certificatesMap.
     *
     * @param certificateHolder to get the certificate from
     * @return a X509Certificate or <code>null</code> when there was an Error with the Certificate
     * @throws CertificateProccessingException on failed conversion from X509CertificateHolder to X509Certificate
     */
    private X509Certificate getCertFromHolder(X509CertificateHolder certificateHolder)
            throws CertificateProccessingException
    {
        //TODO getCertFromHolder violates "do one thing" rule (adds to the map and returns a certificate)
        if (!certificatesMap.containsKey(certificateHolder.getSerialNumber()))
        {
            try
            {
                X509Certificate certificate = certConverter.getCertificate(certificateHolder);
                certificatesMap.put(certificate.getSerialNumber(), certificate);
                return certificate;
            }
            catch (CertificateException e)
            {
                LOG.error("Certificate Exception getting Certificate from certHolder.", e);
                throw new CertificateProccessingException(e);
            }
        }
        else
        {
            return certificatesMap.get(certificateHolder.getSerialNumber());
        }
    }

    /**
     * Adds multiple Certificates out of a Collection of X509CertificateHolder into certificatesMap.
     *
     * @param certHolders Collection of X509CertificateHolder
     */
    private void addAllCerts(Collection<X509CertificateHolder> certHolders)
    {
        for (X509CertificateHolder certificateHolder : certHolders)
        {
            try
            {
                getCertFromHolder(certificateHolder);
            }
            catch (CertificateProccessingException e)
            {
                LOG.warn("Certificate Exception getting Certificate from certHolder.", e);
            }
        }
    }

    /**
     * Gets a list of X509Certificate out of an array of X509CertificateHolder. The certificates
     * will be added to certificatesMap.
     *
     * @param certHolders Array of X509CertificateHolder
     * @throws CertificateProccessingException when one of the Certificates could not be parsed.
     */
    public void addAllCertsFromHolders(X509CertificateHolder[] certHolders)
            throws CertificateProccessingException
    {
        addAllCerts(Arrays.asList(certHolders));
    }

    /**
     * Traverse the OCSP certificate.
     *
     * @param certHolder
     * @return
     * @throws CertificateProccessingException 
     */
    CertSignatureInformation getOCSPCertInfo(X509CertificateHolder certHolder) throws CertificateProccessingException
    {
        try
        {
            CertSignatureInformation certSignatureInformation = new CertSignatureInformation();
            traverseChain(certConverter.getCertificate(certHolder), certSignatureInformation, MAX_CERTIFICATE_CHAIN_DEPTH);
            return certSignatureInformation;
        }
        catch (CertificateException ex)
        {
            throw new CertificateProccessingException(ex);
        }
        catch (IOException ex)
        {
            throw new CertificateProccessingException(ex);
        }
    }

    /**
     * Get the map of all processed certificates until now.
     * 
     * @return a map of serial numbers to certificates.
     */
    public Map<BigInteger, X509Certificate> getCertificatesMap()
    {
        return certificatesMap;
    }

    /**
     * Data class to hold Signature, Certificate (and its chain(s)) and revocation Information
     */
    public class CertSignatureInformation
    {
        private X509Certificate certificate;
        private String signatureHash;
        private boolean isSelfSigned = false;
        private String ocspUrl;
        private String crlUrl;
        private String issuerUrl;
        private X509Certificate issuerCertificate;
        private CertSignatureInformation certChain;
        private CertSignatureInformation tsaCerts;
        private CertSignatureInformation alternativeCertChain;

        public String getOcspUrl()
        {
            return ocspUrl;
        }

        public void setOcspUrl(String ocspUrl)
        {
            this.ocspUrl = ocspUrl;
        }

        public void setIssuerUrl(String issuerUrl)
        {
            this.issuerUrl = issuerUrl;
        }

        public String getCrlUrl()
        {
            return crlUrl;
        }

        public X509Certificate getCertificate()
        {
            return certificate;
        }

        public boolean isSelfSigned()
        {
            return isSelfSigned;
        }

        public X509Certificate getIssuerCertificate()
        {
            return issuerCertificate;
        }

        public String getSignatureHash()
        {
            return signatureHash;
        }

        public CertSignatureInformation getCertChain()
        {
            return certChain;
        }

        public CertSignatureInformation getTsaCerts()
        {
            return tsaCerts;
        }

        public CertSignatureInformation getAlternativeCertChain()
        {
            return alternativeCertChain;
        }
    }
}
