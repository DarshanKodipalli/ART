import { Injectable } from '@angular/core';
import { Http,ResponseContentType } from '@angular/http'

@Injectable({
  providedIn: 'root'
})
export class RestService {

  private loginData:any = {};  
  private fileTemp:any = {};
  private invoice:any = {}
  private payment:any = {}
  private fileTempOrder:any = {};
  private receipt:any = {}
  private directInvoice:any = {};
  private signature:any = {};
  constructor(private http: Http) {
      this.loginData = localStorage.getItem("login")  
  }

  setFileTempInvoice(arg){
    this.fileTemp = arg;
  }

  setFileTemp(arg){
    this.fileTempOrder = arg;
  }
  getFileTemp(){
    return this.fileTempOrder;
  }
  setSignatureTemp(arg){
    this.signature = arg;
  }
  getSignatureTemp(){
    return this.signature;
  }
  setDirectInvoiceTemp(arg){
    this.directInvoice = arg;
  }
  getDirectInvoiceTemp(){
    return this.directInvoice;
  }  
  setReceiptTemp(arg){
    this.receipt = arg;
  }
  getReceiptTemp(){
    return this.receipt;
  }
  getInvoiceFile(){
    return this.fileTemp;
  }

  setInvoice(arg){
    this.invoice = arg;
  }
  getInvoice(){
    return this.invoice;
  }
  setPayment(arg){
    this.payment = arg;
  }
  getPayment(){
    return this.payment;
  }  
  getAllUsers(){
    return this.http.get("http://localhost:3000/api/v1/users",{withCredentials:true});
  }  
  SignUp(signUpData){
    return this.http.post("http://localhost:3000/api/v1/signup",signUpData,{withCredentials: true});
  }  
  refreshFeed(){
    return this.http.get("http://localhost:3000/api/v1/carts/bulk",{withCredentials:true});
  }
  viewInvoice(data){
    return this.http.post("http://localhost:3000/api/v1/view/invoice",data,{withCredentials: true,responseType:ResponseContentType.Blob})
  }    
  viewSignedInvoiceFromChecked(data){
    return this.http.post("http://localhost:3000/api/v1/view/invoicesignedinvoice",data,{withCredentials: true,responseType:ResponseContentType.Blob})    
  }
  viewPayment(data){
    return this.http.post("http://localhost:3000/api/v1/view/payment",data,{withCredentials: true,responseType:ResponseContentType.Blob})    
  }
  viewPaymentBuyer(data){
    return this.http.post("http://localhost:3000/api/v1/view/buyerpayment",data,{withCredentials: true,responseType:ResponseContentType.Blob})        
  }
  getPaymentsMade(){
    return this.http.get("http://localhost:3000/api/v1/payments",{withCredentials: true});
  }
  getTransactionOrderDetails(data){
    console.log(data)
    var URL = "http://localhost:3000/api/v1/transactions/assets/"+data;
    console.log(URL)
      return this.http.get(URL,{withCredentials: true});      
  }
  searchOrders(data){
    return this.http.post("http://localhost:3000/api/v1/searchOrders", data,{withCredentials: true});    
  }
  searchInvoices(data){
    return this.http.post("http://localhost:3000/api/v1/searchInvoices", data,{withCredentials: true});    
  }
  searchPayments(data){
    return this.http.post("http://localhost:3000/api/v1/searchPayments", data,{withCredentials: true});    
  }    
  getTransactionInvoiceDetails(data){
    var URL = "http://localhost:3000/api/v1/transactions/assets/"+data;
    console.log(URL)
      return this.http.get(URL,{withCredentials: true});      
  }
  getTransactionPaymentDetails(data){
    var URL = "http://localhost:3000/api/v1/transactions/assets/"+data;
    console.log(URL)
      return this.http.get(URL,{withCredentials: true});      
  }
  getSpecificTransactionDetail(data){
    return this.http.get("http://localhost:3000/api/v1/transactions/"+data.transactionId+"?action="+data.action,{withCredentials: true});
  }
  signIn(data){
    return this.http.post("http://localhost:3000/api/v1/login", data,{withCredentials: true});
  }

  signUp(data){
    return this.http.post("http://localhost:3000/api/v1/signup", data);
  }
  
  getUsers(){
		return this.http.get("http://localhost:3000/api/v1/users",{withCredentials:true});
  }
  
  updatePassword(data){
		return this.http.post("http://localhost:3000/api/v1/users/me/password",data,{withCredentials:true});
  }

  updateProfile(data){
    return this.http.put("http://localhost:3000/api/v1/users/me",data,{withCredentials: true});
  }

  updateKyc(data){
    return this.http.post("http://localhost:3000/api/v1/users/me/kyc",data,{withCredentials: true});		
  }
  
  placeOrder(data){
    console.log(data)
    return this.http.post("http://localhost:3000/api/v1/orders",data,{withCredentials: true});
  }
  makePayment(data){
    return this.http.post("http://localhost:3000/api/v1/payments",data,{withCredentials: true});    
  }
  
	setCreditLimit(data){
		return this.http.post("http://localhost:3000/api/v1/users/approve/"+data.email,data,{withCredentials:true});
	}
  getAllOrders(){
    return this.http.get("http://localhost:3000/api/v1/orders",{withCredentials: true});
  }
  getOrders() {
    return this.http.get("http://www.mocky.io/v2/5c0cb9f42f00007e00e2e494?mocky-delay=3000ms");
  }

  getOrderById(data){
    return this.http.post("http://localhost:3000/api/v1/getOrder/details",data,{withCredentials:true})
  }
  addAsset(po){
    return this.http.post("http://localhost:3000/api/v1/orders/carts",po,{withCredentials: true});
  }
  createOrder(data){
    return this.http.post("http://localhost:3000/api/v1/orders/carts",data,{withCredentials: true});
  }

  submitOrder(data){
    return this.http.post("http://localhost:3000/api/v1/orders",data,{withCredentials: true});
  }

  approveOrder(data){
		return this.http.post("http://localhost:3000/api/v1/orders/"+data.orderNumber+"/approve",data,{withCredentials: true})
	}

  getInvoices() {
    return this.http.get("http://localhost:3000/api/v1/invoices/carts",{withCredentials: true});
  }
  getToBeApprovedInvoices(){
    return this.http.get("http://localhost:3000/api/v1/invoices",{withCredentials: true});    
  }
  getInvoiceById(){

  }
  sendInvoice(data){
    console.log("sendInvoice")
    return this.http.post("http://localhost:3000/api/v1/invoices",data,{withCredentials: true});
  }
  createInvoice(data){
		return this.http.post("http://localhost:3000/api/v1/invoices/carts",data,{withCredentials: true})		
  }
  
	submitInvoice(data){
		return this.http.post("http://localhost:3000/api/v1/invoices",data,{withCredentials: true});
  }
  
	proposeInvoice(data){
		return this.http.post("http://localhost:3000/api/v1/invoices/"+data.id+"/propose",data,{withCredentials: true});		
  }

	approveInvoice(data){
		return this.http.post("http://localhost:3000/api/v1/invoices/"+data.id+"/approve",data,{withCredentials: true});
	}
  checkerApproveInvoice(data){
    return this.http.post("http://localhost:3000/api/v1/invoices/"+data.id+"/approvechecker",data,{withCredentials: true});
  }  
  getPayments() {
    return this.http.get("http://localhost:3000/api/v1/payments",{withCredentials:true});
  }

  createPayment(data) {
    return this.http.post("http://localhost:3000/api/v1/payments",data,{withCredentials: true});		
  }

  approvePayment(data){
		return this.http.post("http://localhost:3000/api/v1/payments/"+data.paymentNumber+"/approve",data,{withCredentials: true});		
  }
  approveBankerPayment(data){
    return this.http.post("http://localhost:3000/api/v1/invoices/"+data.invoiceNumber+"/acceptproposal",data,{withCredentials: true});    
  }
  getTransactions(){ // transactions done by that particular user

  }

  getTransactionsByOrderNumber(){

  }

  getTransactionDetail(){

  }

  bulkUploadOrders(data){
    return this.http.post("http://localhost:3000/api/v1/carts/bulk",data,{withCredentials:true})
  }

  bulkUploadInvoices(data){
		return this.http.post("http://localhost:3000/api/v1/carts/bulk",data,{withCredentials:true})
  }

/*
 * Notification Services
 */

  // Fetches only unread messages to show in notification bar
  getUnreadNotifications(){

  }

  // Fetches all notifications
  getNotifications(){

  }

/*
 * Reporting Services
 */

  exportInvoices(){

  }

  exportInvoiceById(){

  }

  exportOrderById(){

  }

  exportOrders(){

  }
  
  getBuyerSellerStats(){

  }

  getInvoiceStats(){
    
  }

  getOrderStats(){

  }

}
