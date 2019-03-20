import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Http } from '@angular/http';
import { RestService } from '../services/rest.service';

@Component({
    selector: 'file-upload-bankerReceipt',
    template:'  <label style="color:black" for="files" class="btn">Upload Recipt</label>  <input type="file" id="files" style="visibility:hidden;" #fileInput >'
/*    template: '<input type="file" [multiple]="multiple" #fileInput>'*/
})
export class BankerReceiptFileUploadComponent {
    @Input() multiple: boolean = false;
    @ViewChild('fileInput') inputEl: ElementRef;

    constructor(private http: RestService) {}

    upload() {
        let inputEl: HTMLInputElement = this.inputEl.nativeElement;
        let fileCount: number = inputEl.files.length;
        let formData = new FormData();
        if (fileCount > 0) { // a file was selected
            for (let i = 0; i < fileCount; i++) {
                formData.append('files', inputEl.files.item(i));
            }
        this.http.setReceiptTemp(formData);
        }
    }
}