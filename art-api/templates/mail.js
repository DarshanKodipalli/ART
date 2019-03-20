exports.signup = function(email, password, username, role){
    return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title></title>
  </head>
  <body style="margin:0; padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; min-width:100%; background-color:#FFFFFF;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; background-color:#FFFFFF;" bgcolor="#FFFFFF;">
      <tr>
        <td width="100%" style="padding-left:0; padding-top:30px; padding-right:0; padding-bottom:30px;">
          <table style="width: 870px; border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt; border:1px solid #cccccc;" cellpadding="0" cellspacing="0" align="center" border="0">
            <tbody>
              <tr>
                <td style="padding-left:0; padding-top:0; padding-right:0; padding-bottom:0;">
                  <!-- HEADER Table Start-->
                  <table id="headerBanner" style="width: 870px; height: 44px; background-color: #fff; border-spacing: 0;" cellpadding="0" cellspacing="0" border="0">
                    <tbody>
                      <tr style="padding:0;">
                        <td style="padding-left:40px; padding-top:17px; padding-right:0; padding-bottom:11px; border-bottom: 1px solid #d6dfe6;" border="0">
                          <table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; mso-table-lspace:0pt; mso-table-rspace:0pt;">
                            <tbody>
                               <tr>
<td style="border-collapse: collapse; width: 136px; padding: 0; margin: 0; border-spacing: 0; vertical-align: baseline;" border="0" valign="baseline">
<img alt="ART" title="ART" src="https://aeries.io/wp-content/uploads/2018/07/logo_sldei.png" style="DISPLAY: block" moz-do-not-send="true" height="40" width="136" border="0"></td>
<td style="border-collapse: collapse; height: 40px; padding:0 0 0 5px; color: #454545; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: baseline;" valign="middle"><font face="Helvetica, Arial, sans-serif;">Cloud</font></td>
</tr>

                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; background-color:#0179C5;width:870px;height:240px;color:#ffffff;"> <table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 13px; font-color: #ffffff; font-weight: normal; line-height: 20px;  mso-table-lspace:0pt; mso-table-rspace:0pt;">
  <tbody>
    <tr>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; vertical-align:baseline;height:240px;"><table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 13px; font-color: #ffffff; font-weight: normal; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="499" height="240px">
  <tbody>
    <tr>
      <td style=" padding-left:40px; padding-top:20px; padding-right:0; padding-bottom:0;color:#ffffff;font-family: Helvetica Neue, Helvetica, Arial, sans-serif;font-size:16px;vertical-align:top;"><h1 style="font-weight: normal; font-size: 36px;line-height:36px;">Get Started Now with ART `+role+` Account</h1><br></td>
    </tr>
    <tr>
      <td style="vertical-align:bottom;padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; height: 51px;"><img border="0" width="499" height="51" src="https://cloud.oracle.com/cloudinfra/saas/notifications/OPC-banner-right-bottom.jpg" style="display:block;background-color: transparent; border: none;" moz-do-not-send="true">

</td>
    </tr>
  </tbody>
</table>
</td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><img border="0" width="371" height="240" src="https://cloud.oracle.com/cloudinfra/saas/notifications/OPC-banner-left.jpg" style="display:block;background-color: transparent; border: none;" moz-do-not-send="true">

</td>
    </tr>
  </tbody>
</table>
                       
                            
                          
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <!-- HEADER Table End-->
</td>
          </tr>
          <!-- BEGIN MAIN EMAIL BODY -->
          <tr>
            <td style="padding-left:0; padding-top:0; padding-right:0; padding-bottom:0;"><table style="width: 870px; border-spacing: 0;" cellpadding="0" cellspacing="0" border="0">
                <tbody>
                  <tr border="0">
                    <td style="border-collapse: collapse; padding-top:30px; padding-right: 40px; padding-bottom: 25px; padding-left:40px; background-color: #fff; "><div>
                        <table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="790">
                          <tr>
                            <td valign="top" style=" padding-left:0; padding-top:0; padding-right:40px; padding-bottom:0;"><table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 16px; color: #333333; font-weight: normal; line-height: 22px; mso-table-lspace:0pt; mso-table-rspace:0pt;">
                                <tbody>
                                  <tr>
                                    <td style=" padding-left:0px; padding-top:0px; padding-right:0px; padding-bottom:20px; "><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">
Hello ART User,
</font></td>
                                  </tr>
                                  <tr>
                                    <td style="padding-left:0px; padding-top:0px; padding-right:0px; padding-bottom:0px;text-align:justify; "><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">

Thanks for creating an ART account. We are currently provisioning your services. We're excited for you to take advantage of your 600 SGD in credits, which you can apply toward all eligible ART Infrastructure and Platform Services over the next 30 days. Your usage during the promotion period is discounted, allowing you to experience a wide range of ART services.
</font></td>
                                  </tr>
                                </tbody>
                              </table></td>
<td valign="top" align="right" style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0;">
<table border="0" cellspacing="0" cellpadding="0" bgcolor="#027BC7" width="290" height="180" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  mso-table-lspace:0pt; mso-table-rspace:0pt;color:#fff;">
                                <tbody>
                                  <tr>
                                    <td style="width:290px;height:180px;text-align:center;color:#fff;">
<div style="display: table-cell;vertical-align: middle;">



<div style="width:300px; ;padding: 5px;margin: 7px auto;text-align: center;">
<font face="HelveticaNeue-Thin, Helvetica, Arial, sans-serif;">Available Cloud Service Credits</font>
<br>
<font face="HelveticaNeue-Thin, Helvetica, Arial, sans-serif;"><span style="font-size:90px; font-weight:normal;">
600
</span><span style="font-size:30px">
SGD
</span> </font>
</div>


                              </div></td>
                          </tr>
                        </table>
                        </td>
                          </tr>
                        </table>
                      </div>
                      <div>
                        <table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 13px; font-color: #454545; font-weight: normal; line-height: 20px;  mso-table-lspace:0pt; mso-table-rspace:0pt;">
                          <tbody>
<tr>
													    <td style="padding-left:0px; padding-top:15px; padding-right:0px; padding-bottom:15px;font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 16px; color: #333333; font-weight: normal; line-height: 22px;text-align:justify; "><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">
<strong>ART Autonomous Data Management</strong><br>
Thinking of Data management? Have you heard about the new ART Autonomous Database offering from ART?  ART Autonomous Database is a new category of database services unique to ART Cloud, which will forever change how you think about data management.  For more information, check out  <a href="http://aeries.io" style="text-decoration:none;"><font color="#008cba">Autonomous Transaction Processing</font></a> or <a href="http://aeries.io" style="text-decoration:none;"><font color="#008cba">Autonomous Data Warehouse</font></a>.  
</font></td>
                                  </tr>
                          </tbody>
                        </table>
<table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-table-lspace:0pt; mso-table-rspace:0pt;background-color:#DEE7ED;"" width="790">
<tr>
<td valign="top" style=" padding-left:15px; padding-top:15px; padding-right:15px; padding-bottom:15px; font-size: 15px; color: #333333; line-height: 18px;">
<img border="0" width="24" height="24" src="https://cloud.ART.com/cloudinfra/saas/notifications/info_48_mono.png" style="display:block;background-color: transparent; border: none;" moz-do-not-send="true">


</td>
<td style=" padding-left:10px; padding-top:15px; padding-right:15px; padding-bottom:15px; font-size: 15px; color: #333333; line-height: 18px;text-align:justify;">
<strong>We are currently provisioning your services, which may take up to 15 minutes to complete.</strong><br>
After your ART Cloud services are ready, you'll receive a <a href="http://aeries.io/get_started" style="text-decoration:none;"><font color="#008cba">notification</font></a> on your My Services dashboard. In the meantime, use the temporary credentials below to access your account and view the tutorials within our <a href="http://aeries.io/guided_journey_info" style="text-decoration:none;"><font color="#008cba">Guided Journey</font></a>.
</td>
</tr>
</table>
                      </div></td>
                  </tr>
<tr border="0">
<td style="border-collapse: collapse; padding-top:0px; padding-right: 40px; padding-bottom: 0px; padding-left:40px; background-color:#DEE7ED;">
<table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-table-lspace:0pt; mso-table-rspace:0pt;" width="790">
<tr>
<td valign="top" style=" padding-left:0; padding-top:20px; padding-right:0; padding-bottom:0px;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">
  <h1 style="font-weight: normal; font-size: 34px; font-color: #252525; line-height: 38px; margin: 0px 0px;">Access Details for My Services</h1></font>


  <table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 16px; color: #333333; font-weight: normal; line-height: 22px; mso-table-lspace:0pt; mso-table-rspace:0pt;">
    <tbody>

      <tr>
	<td style="padding-left:0px; padding-top:30px; padding-right:40px; padding-bottom:12px; "><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">Username:</font></td>
	<td style="padding-left:0px; padding-top:30px; padding-right:40px; padding-bottom:12px; ">`+email+`</td>
      </tr>
      <tr>
	<td style="padding-left:0px; padding-top:0px; padding-right:40px; padding-bottom:12px; "><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">Temporary Password:</font></td>
	<td style="padding-left:0px; padding-top:0px; padding-right:40px; padding-bottom:12px; ">`+password+`</td></tr>
<tr>
	<td style="padding-left:0px; padding-top:0px; padding-right:40px; padding-bottom:25px; "><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">
Cloud Account:
</font></td>
	<td style="padding-left:0px; padding-top:0px; padding-right:40px; padding-bottom:25px; ">`+username+`</td>
      </tr>

    </tbody>
  </table>
</td>

<td valign="middle" style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0;">
  <table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 16px; font-color: #454545; font-weight: normal; line-height: 20px;  mso-table-lspace:0pt; mso-table-rspace:0pt;background-color:#027BC7;width:290px;">
    <tbody>
      <tr>
	<td style=" padding-left:20px; padding-top:15px; padding-right:0px; padding-bottom:15px;color:#fff;font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 16px;"><a href="http://localhost:4200" style="text-decoration:none;color:#fff;" target="_blank">Get Started with ART Cloud</a></td>
	<td style=" padding-left:10px; padding-top:15px; padding-right:20px; padding-bottom:15px;"><a href="http://art.com/gettingStarted" style="text-decoration:none" target="_blank">


</a></td>
      </tr>
    </tbody>
  </table>
</td>
</tr>
</table>
</td>
</tr>




<tr border="0">
  <td style="border-collapse: collapse; padding-top:0px; padding-right: 20px; padding-bottom: 5px; padding-left:40px; background-color: #fff; ">
    <table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 13px; font-color: #454545; font-weight: normal; line-height: 20px;  mso-table-lspace:0pt; mso-table-rspace:0pt;">
      <tbody>
<!--</td></tr></table></td></tr>-->


</td></tr></table></td></tr>
                  
<tr>
                  <td style="border-collapse: collapse; padding-top:20px; padding-right: 40px; padding-bottom: 30px; padding-left:40px; background-color: #fff; "><div>
                       <table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 14px; font-color: #454545; font-weight: normal; line-height: 20px;  mso-table-lspace:0pt; mso-table-rspace:0pt;">
  <tbody>
    <tr>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0px; "><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">
 <h2 style="font-weight: normal; font-size: 24px; font-color: #252525; line-height: 30px;">Order Details</h2>
                                </font></td>
    </tr>
    <tr>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 14px; font-color: #454545; font-weight: normal; line-height: 20px;  mso-table-lspace:0pt; mso-table-rspace:0pt;">
  <tbody>
    <tr>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><img border="0" width="48" height="48" src="http://cloud-sites.ART.com/cloudinfra/saas/notifications/OPC-cart_48.png" style="display:block;background-color: transparent; border: none;" moz-do-not-send="true">

</td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><table cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 14px; font-color: #454545; font-weight: normal; line-height: 20px;  mso-table-lspace:0pt; mso-table-rspace:0pt;">
  <tbody>

    <tr>
      <td style=" padding-left:20px; padding-top:0; padding-right:0; padding-bottom:0px; font-size:14px; color: #666;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">Order ID: <font color="#252525">20094330</font></font></td>
    </tr>

    <tr>
      <td style=" padding-left:20px; padding-top:0; padding-right:0; padding-bottom:0px; font-size:14px; color: #666;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">Order Date: <font color="#252525">Tuesday, October 23, 2018 4:18 AM UTC</font></font></td>
    </tr>
    <tr>
      <td style=" padding-left:20px; padding-top:0; padding-right:0; padding-bottom:0px; font-size:14px; color: #666;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">Customer Account: <font color="#252525">praveen@Aeries.io-735818</font></font></td>
    </tr>
<tr>
<tr>
      <td style=" padding-left:20px; padding-top:0; padding-right:0; padding-bottom:0px; font-size:14px; color: #666;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;">Cloud Account:&nbsp;<font color="#252525">pravn1729

</font></font></td>
    </tr>
  </tbody>
</table>
</td>
    </tr>
  </tbody>
</table>
</td>
<tr>
                              <td style=" padding-left:0; padding-top:15px; padding-right:0; padding-bottom:15px; font-size: 12px; color: #333333; line-height: 18px;">

Your credit card, if requested during sign up, was used only for verification purposes and will not be charged unless you <strong>Upgrade to Paid</strong> in <strong>My Services</strong>.
&nbsp;For more information, see <a href="http://www.ART.com/pls/topic/lookup?ctx=cloud&id=email_free_credits" style="text-decoration:none;"><font color="#008cba">Requesting and Managing ART Cloud Promotions</font></a>.
</font></td>
                            </tr>

    </tr>
  </tbody>
</table>


                      </div>
                     </td>
                  </tr>

                  <tr border="0">
                    <td style="border-collapse: collapse; padding-top:0px; padding-right: 40px; padding-bottom: 0px; padding-left:40px; background-color:#EFF3F5;"><div style="height:10px">
                    &nbsp;
                    </div>
                    </td>
                    </tr>
                    <tr>
                     <td style="border-collapse: collapse; padding-top:20px; padding-right: 40px; padding-bottom: 25px; padding-left:40px; background-color: #fff; "><div>
                     <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 14px; font-color: #454545; font-weight: normal; line-height: 20px;  mso-table-lspace:0pt; mso-table-rspace:0pt;">
  <tbody>
    <tr>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><a href="https://sc-oal-en.custhelp.com/app/chat/ART_sc_chat_launch"><img style="display: block;background-color: transparent; border: none;" src="http://cloud-sites.ART.com/cloudinfra/saas/notifications/OPC-chatsales_24.png" moz-do-not-send="true" height="24" width="24" alt=""></a></td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><a href="https://sc-oal-en.custhelp.com/app/chat/ART_sc_chat_launch" style="text-decoration:none;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;" style="font-size: 14px; color: #000;">Chat with Sales</font></a></td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><a href="https://oc-cx-en.custhelp.com/app/chat/chat_launch"><img style="display: block;background-color: transparent; border: none;" src="http://cloud-sites.ART.com/cloudinfra/saas/notifications/OPC-chatsupport_24.png" moz-do-not-send="true" height="24" width="24" alt=""></a></td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><a href="https://oc-cx-en.custhelp.com/app/chat/chat_launch" style="text-decoration:none;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;" style="font-size: 14px; color: #000;">Chat with Support</font></a></td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><a href="http://docs.ART.com/en/cloud/"><img style="display: block;background-color: transparent; border: none;" src="http://cloud-sites.ART.com/cloudinfra/saas/notifications/OPC-documentation_24.png" moz-do-not-send="true" height="24" width="24" alt=""></a></td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><a href="http://docs.ART.com/en/cloud/" style="text-decoration:none;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;" style="font-size: 14px; color: #000;">Documentation</font></a></td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><a href="https://shop.ART.com/apex/f?p=1000:23"><img style="display: block;background-color: transparent; border: none;" src="http://cloud-sites.ART.com/cloudinfra/saas/notifications/OPC-faq_24.png" moz-do-not-send="true" height="24" width="24" alt=""></a></td>
      <td style=" padding-left:0; padding-top:0; padding-right:0; padding-bottom:0; "><a href="https://shop.ART.com/apex/f?p=1000:23" style="text-decoration:none;"><font face="Helvetica Neue, Helvetica, Arial, sans-serif;" style="font-size: 14px; color: #000;">FAQ</font></a></td>
    </tr>
  </tbody>
</table>

                     </div>
                     </td>
                    </tr>
                     <tr border="0">
                    <td style="border-collapse: collapse; padding-top:0px; padding-right: 40px; padding-bottom: 0px; padding-left:40px; background-color:#EFF3F5;"><div style="height:10px">
                    &nbsp;
                    </div>
                    </td>
                    </tr>
                     <tr>
                     <td style="border-collapse: collapse; padding-top:20px; padding-right: 40px; padding-bottom: 0px; padding-left:40px; background-color: #fff; "><div style="text-align:center">
<font style="border-spacing:0; font-family: Helvetica Neue, Helvetica, Arial, sans-serif;  font-size: 14px; font-weight: normal;"> <font color="red"><span>Integrated Cloud</span></font> Applications & Platform Services</font>
                     </div>
                     </td>
                     </tr>
                </tbody>
              </table></td>
          </tr>
          <!-- END MAIN EMAIL BODY --> 
          
          <!-- BEGIN EMAIL FOOTER -->
          <tr>
            <td style="padding-left:0; padding-top:0; padding-right:0; padding-bottom:0;"><table style="width: 870px; border-spacing: 0; mso-table-lspace:0pt; mso-table-rspace:0pt;" cellpadding="0" cellspacing="0" border="0">
                <tbody>
                  <tr border="0">
                    <td style="border-collapse: collapse; padding-top:20px; padding-right: 40px; padding-bottom: 30px; padding-left:40px; background-color: #fff; "><table id="footerBanner" style="font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; font-size: 11px; border-spacing: 0; mso-table-lspace:0pt; mso-table-rspace:0pt; border-top:1px solid #cccccc; width: 790px;" cellpadding="0" cellspacing="0" align="center" border="0">
                        <tbody>
                          <tr border="0">
                            <td style="border-collapse: collapse; padding: 0px 0px 0px 0px; font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; font-size: 11px; color: #333; line-height: 24px;" valign="middle"><font face="Helvetica, Arial, sans-serif;">Copyright &copy; 2018,  ART and/or its affiliates. All rights reserved.</font></td>
                            <td style="border-collapse: collapse; padding: 0px 0px 0px 0px; font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; font-size: 11px; color: #333; line-height: 24px;" valign="middle" align="right"><a href="http://www.ART.com/us/corporate/index.html" target="_blank" style="text-decoration: none;"><font color="#000000" face="Helvetica, Arial, sans-serif;">About ART</font></a> &nbsp;|&nbsp; <a href="http://www.ART.com/us/legal/terms/index.html" target="_blank" style="text-decoration: none;"><font color="#000000" face="Helvetica, Arial, sans-serif;">Legal Notices and Terms of Use</font></a> &nbsp;|&nbsp; <a href="http://www.ART.com/us/legal/privacy/overview/index.html" target="_blank" style="text-decoration: none;"><font color="#000000" face="Helvetica, Arial, sans-serif;">Privacy Statement</font></a></td>
                          </tr>
                          <tr border="0">
                            <td colspan="2" style="border-collapse: collapse; padding: 10px 0px 0px 0px; font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; font-size: 11px; color: #333; line-height: 16px;" valign="middle"><!-- notification preferences --> 
                              <span style="margin: 0"><font face="Helvetica, Arial, sans-serif;">
This is a system generated message.  Don't reply to this message.  You're receiving this e-mail as a result of your current relationship with ART Cloud. General marketing opt-out preferences have been overridden to ensure that you receive this e-mail.</font></span>

                              </font></span><!-- social buttons --></td>
                          </tr>
                        </tbody>
                      </table></td>
                  </tr>
                </tbody>
              </table></td>
          </tr>
          <!-- END EMAIL FOOTER -->

          
        </tbody>
      </table></td>
  </tr>
</table>
</body>
</html>`;
}