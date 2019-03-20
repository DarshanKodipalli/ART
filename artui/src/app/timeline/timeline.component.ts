import { Component, OnInit } from '@angular/core';
import { AppComponent } from '../app.component';
import { formatDate } from '@angular/common'
import { RestService } from '../services/rest.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {
  private transactionData:any = {};
  private transactionDetails:any = [];
  private specificDetail:any={};
  private orderDetails:any = [];
  private orderNumber:string = "";
  private temp:any = [];
  private order:any = [];
  private payment:any = [];

  private orderCreated:any = {};
  private orderSubmitted:any = {};
  private orderApproved:any = {};
  private invoiceCreated:any = {};
  private invoiceSubmitted:any = {};
  private invoiceApproved:any = {};
  private sellerInvoiceAccept:any = {};
  private sellerInvoiceProposal:any = {};
  private paymentCreatedBB:any = {};
  private paymentAcknowledged:any = {};
  private buyerPayentBanker:any = {};
  private completeJson:string = "";
  private orderCreatedBool:boolean = false;
  private sellerInvoiceAcceptBool:boolean = false;
  private orderSubmittedBool:boolean= false;
  private orderApprovedBool:boolean= false;
  private invoiceCreatedBool:boolean= false;
  private invoiceSubmittedBool:boolean= false;
  private invoiceApprovedBool:boolean= false;
  private sellerInvoiceProposalBool:boolean= false;
  private paymentCreatedBBBool:boolean= false;
  private paymentAcknowledgedBool:boolean = false;
  private buyerPayentBankerBool:boolean = false;
  private  invoiceNumber:any = "";
  private currentStatus:any = "";
  private currentStatusColor:any = {};
  private nextOperation:any = "";
  private today:any;
  private actualDate:String = "";

  constructor(private appCompo: AppComponent, private http: RestService) {

    var todaysDate = new Date();
    var todayFormat = formatDate(todaysDate, 'dd-MM-yyyy hh:mm:ss a', 'en-US', '+0530');
    console.log(todayFormat);
    var date:any = todayFormat.split(" ");
    console.log(date);
    console.log(date[0].split("-"));
    var splitDate = date[0].split("-");
    var day = splitDate[0];
    var monthNumber = splitDate[1];
    var montha:String = "";
    if(monthNumber.toString().length === 1){
      montha = "0"+monthNumber;
    }else{
      montha = monthNumber.toString();
    }
    console.log(montha);
    console.log(monthNumber);
    var monthText = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
    var month;
    switch (montha.toString()) {
      case "01": month = monthText[0] ; break
      case "02": month = monthText[1] ; break
      case "03": month = monthText[2] ; break
      case "04": month = monthText[3] ; break
      case "05": month = monthText[4] ; break
      case "06": month = monthText[5] ; break
      case "07": month = monthText[6] ; break
      case "08": month = monthText[7] ; break
      case "09": month = monthText[8] ; break
      case "10": month = monthText[9] ; break
      case "11": month = monthText[10] ; break
      default: month = monthText[11] ; break
    }
         this.actualDate = day+"-"+month+"-"+splitDate[2];
         console.log(this.actualDate);

    var data = JSON.parse(localStorage.getItem("ViewTransactionsAssetData"));
    console.log("____________________")
      console.log(data);
      this.orderNumber = data.orderNumber;
    console.log("____________________")      
    this.specificDetail.id = "";
    this.specificDetail.timestamp = "";
    this.specificDetail.buyerId = "";
    this.specificDetail.sellerId = "";
         this.http.getTransactionOrderDetails(data.orderNumber).subscribe(
           (response)=>{
             console.log("Order Details:")
             console.log(response.json());
             this.temp = response.json().data;
             if(response.json().data[0]){
               this.orderCreated = response.json().data[0];
               this.orderCreated.dispTransactionId = this.orderCreated.transactionId.substr(0,14)+"..."
               this.orderCreatedBool = true;
               this.currentStatus = this.orderCreated.description;  
               this.currentStatusColor = {"color": "purple"}
               this.nextOperation = "Submitting the Order"
               this.invoiceNumber = "Invoice not Created"       
               console.log("orderCreatedBool"+this.orderCreatedBool)
             } if(response.json().data[1]){
               this.orderSubmitted = response.json().data[1];
               this.orderSubmitted.dispTransactionId = this.orderSubmitted.transactionId.substr(0,14)+"..."
               this.orderSubmittedBool = true;               
               this.nextOperation = "Approving the Order"       
               this.currentStatus = this.orderSubmitted.description;
               this.currentStatusColor = {"color": "orange"}               
               this.invoiceNumber = "Invoice not Created"       
               console.log("orderSubmittedBool:"+this.orderSubmittedBool)
             } if(response.json().data[2]){
               this.orderApproved = response.json().data[2];
               this.orderApproved.dispTransactionId = this.orderApproved.transactionId.substr(0,14)+"..."
               this.orderApprovedBool = true;
               this.nextOperation = "Creating the Invoice"       
               this.currentStatus = this.orderApproved.description;
               this.currentStatusColor = {"color": "teal"}
               this.invoiceNumber = "Invoice not Created"       
               console.log("orderApprovedBool:"+this.orderApprovedBool);
             }
             this.http.getTransactionInvoiceDetails(data.invoiceNumber).subscribe(
               (response)=>{
                 console.log(response.json());
                 this.order = response.json().data;
                 if(this.order[0]){
                   this.invoiceCreated = this.order[0];
                   this.invoiceCreated.dispTransactionId = this.invoiceCreated.transactionId.substr(0,14)+"..."
                   this.invoiceCreatedBool = true;
                   this.currentStatus = this.invoiceCreated.description;                   
                   this.nextOperation = "Submitting the Invoice" 
                   this.currentStatusColor = {"color": "pink"}      
                   this.invoiceNumber = this.invoiceCreated.assetId;
                   console.log("invoiceCreatedBool"+this.invoiceCreatedBool)
                 } if(this.order[1]){
                   this.invoiceSubmitted = this.order[1];
                   this.invoiceSubmitted.dispTransactionId = this.invoiceSubmitted.transactionId.substr(0,14)+"..."
                   this.invoiceSubmittedBool = true;
                   this.currentStatus = this.invoiceSubmitted.description;
                   this.nextOperation = "Approving the Invoice"
                   this.currentStatusColor = {"color": "indigo"}       
                   console.log("invoiceSubmittedBool"+this.invoiceSubmittedBool);
                 } if(this.order[2]){
                   this.invoiceApproved = this.order[2];
                   this.invoiceApproved.dispTransactionId = this.invoiceApproved.transactionId.substr(0,14)+"..."
                   this.invoiceApprovedBool = true;
                   this.currentStatus = this.invoiceApproved.description;
                   this.nextOperation = "Accept the Invoice "
                   this.currentStatusColor = {"color": "purple"}       
                   console.log("invoiceApprovedBool"+this.invoiceApprovedBool)
                 } if(this.order[3]){
                   this.sellerInvoiceAccept = this.order[3]
                   this.sellerInvoiceAccept.dispTransactionId = this.sellerInvoiceAccept.transactionId.substr(0,14)+"..."
                   this.sellerInvoiceAcceptBool = true;
                   this.currentStatus = this.sellerInvoiceAccept.description;
                  this.nextOperation = "Propose the Invoice"
                  this.currentStatusColor = {"color": "teal"}                   
                   console.log("sellerInvoiceProposalBool"+this.sellerInvoiceAcceptBool)
                 }if(this.order[4]){
                   this.sellerInvoiceProposal = this.order[4]
                   this.sellerInvoiceProposal.dispTransactionId = this.sellerInvoiceProposal.transactionId.substr(0,14)+"..."
                   this.sellerInvoiceProposalBool = true;
                   this.currentStatus = this.sellerInvoiceProposal.description;
                  this.nextOperation = "Banker Payment"
                  this.currentStatusColor = {"color": "teal"}                   
                   console.log("sellerInvoiceProposalBool"+this.sellerInvoiceProposalBool)
                 }
                 this.http.getTransactionPaymentDetails(data.paymentNumber).subscribe(
                   (response)=>{
                     console.log(response.json());
                     this.payment = response.json().data;
                     console.log(this.payment)
                     if(this.payment[0]){
                       this.paymentCreatedBB = this.payment[0]
                       this.paymentCreatedBB.dispTransactionId = this.paymentCreatedBB.transactionId.substr(0,14)+"..."
                       this.paymentCreatedBBBool = true;
                       this.nextOperation = "Payment Acknowledgement"
                       this.currentStatusColor = {"color": "teal"}
                       this.currentStatus = this.paymentCreatedBB.description;
                       console.log("paymentCreatedBBBool"+this.paymentCreatedBBBool)
                     }if(this.payment[1]){
                       this.paymentAcknowledged = this.payment[1]
                       this.paymentAcknowledged.dispTransactionId = this.paymentAcknowledged.transactionId.substr(0,14)+"..."
                       this.paymentAcknowledgedBool = true;
                       this.nextOperation = "Buyer payment to Banker"
                       this.currentStatusColor = {"color": "teal"}
                       this.currentStatus = this.paymentAcknowledged.description;
                       console.log("paymentAcknowledgedBBBool"+this.paymentAcknowledgedBool)
                     }if(this.payment[2]){
                       this.buyerPayentBanker = this.payment[0]
                       this.buyerPayentBanker.dispTransactionId = this.buyerPayentBanker.transactionId.substr(0,14)+"..."
                       this.buyerPayentBankerBool = true;
                       this.nextOperation = "Payment Acknowledgement"
                       this.currentStatusColor = {"color": "teal"}
                       this.currentStatus = this.buyerPayentBanker.description;
                       console.log("buyerPayentBankerBool"+this.buyerPayentBankerBool)
                     }
                   },(error)=>{
                     console.log(error);
                   })                 
               },(error)=>{
                 console.log(error);
               })
           },(error)=>{
             console.log(error);
           })
   }

    ngOnInit() {

    }

    getDetails(y){
      this.http.getSpecificTransactionDetail(y).subscribe(
        (response)=>{
          console.log("______________________")
          console.log(response.json());
          this.specificDetail = response.json().data[0];
          this.specificDetail.sellerId = this.specificDetail.seller.split('#')[1];
          this.specificDetail.buyerId = this.specificDetail.buyer.split('#')[1];
          this.specificDetail.bankerId = this.specificDetail.banker.split('#')[1];
          this.completeJson = "{"+"\n"+ 
                      "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+"'amount':"+"'"+this.specificDetail.amount+"',"+"\n"+
                      "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+"'banker':"+"'"+this.specificDetail.bankerId+"',"+"\n"+
                      "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+"'seller':"+"'"+this.specificDetail.sellerId+"',"+"\n"+
                      "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+"'banker':"+"'"+this.specificDetail.buyerId+"',"+"\n"+
                      "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+"'timeStamp':"+"'"+this.specificDetail.timestamp+"',"+"\n"+
                      "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+"'transactionId':"+"'"+this.specificDetail.transactionId+"'"+"\n"+
                    "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"+"}";
        },(error)=>{
          console.log(error);
        })
    }
}
