import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { RestService } from '../services/rest.service';
declare var jquery:any;
declare var $ :any;
@Component({
    selector: 'file-upload-signature',
    template:'  <label style="color:black" for="files" class="btn">Upload Signatures</label>  <input type="file" id="files" style="margin-left:2%;" #fileInput >'
/*    template: '<input type="file" [multiple]="multiple" #fileInput>'*/
})
export class SellerInvoiceSignatureUploadComponent {
    @Input() multiple: boolean = false;
    @ViewChild('fileInput') inputEl: ElementRef;

    constructor(private http: RestService) {}

    upload(e:Event) {
        console.log(e)
        var reader = new FileReader();
        reader.onload = function (e:any) {
            console.log(e)
            $('#dispImage')
            .attr('src', e.target.value)
            .width(200)
            .height(400)
        }
        let inputEl: HTMLInputElement = this.inputEl.nativeElement;
        let fileCount: number = inputEl.files.length;
        let formData = new FormData();
        if (fileCount > 0) { // a file was selected
            for (let i = 0; i < fileCount; i++) {
                formData.append('files', inputEl.files.item(i));
            }
        this.http.setSignatureTemp(formData);
        }
    }
}