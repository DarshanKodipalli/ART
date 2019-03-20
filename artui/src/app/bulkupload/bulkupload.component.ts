import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2'
import { RestService } from '../services/rest.service';
@Component({
  selector: 'app-bulkupload',
  templateUrl: './bulkupload.component.html',
  styleUrls: ['./bulkupload.component.scss']
})
export class BulkuploadComponent implements OnInit {

  constructor(private http:RestService) { }
  private types:any;
  private updateBuyer :any = {};
  public type:String;
  public uploadProgress:any = [];
  private today:any;
  ngOnInit() {
  }
  addOrders(){
    if(this.http.getFileTemp()){
      var formData = this.http.getFileTemp();
      formData.append("fileType","order");
      this.http.bulkUploadOrders(formData).subscribe(
        (response)=>{
          console.log(response);
/*          this.spinnerService.hide();
          this.rout.navigate(['']);*/
          this.http.refreshFeed().subscribe(
            (response)=>{
              console.log(response);
              var tempResponse = response.json();
              for(var i=0;i<tempResponse.data.length;i++){
                  tempResponse.data[i].uploadedDate = tempResponse.data[i].createDate.split('T')[0];
                  tempResponse.data[i].uploadedTime = tempResponse.data[i].createDate.split('T')[1];
                  this.uploadProgress.push(tempResponse.data[i]);
                  console.log(this.uploadProgress);
              }
            },(error)=>{
              console.log(error);
            })
        },(error)=>{
          console.log(error);
        })
    }
  }
  refreshFeed(){
    this.uploadProgress = [];
    this.http.refreshFeed().subscribe(
      (response)=>{
        console.log("Refresh Log");
        console.log(response.json());
        var tempResponse = response.json();
        for(var i=0;i<tempResponse.data.length;i++){
            tempResponse.data[i].uploadedDate = tempResponse.data[i].createDate.split('T')[0];
            tempResponse.data[i].uploadedTime = tempResponse.data[i].createDate.split('T')[1];
            this.uploadProgress.push(tempResponse.data[i]);
            console.log(this.uploadProgress);
        }
      },(error)=>{
        console.log(error);
      })
  }
}
