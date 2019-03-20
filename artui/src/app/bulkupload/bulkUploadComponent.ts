import { Component, ElementRef, Input, ViewChild } from '@angular/core';

import Swal from 'sweetalert2'
import { RestService } from '../services/rest.service';

@Component({
    selector: 'bulk-upload-orders',
    template:'  <label style="color:black" for="files" class="btn">Choose File</label>  <input type="file" id="files" style="margin-left:2%" #fileInput >'
/*    template: '<input type="file" [multiple]="multiple" #fileInput>'*/
})
export class BulkUploadComponentOrders {
    @Input() multiple: boolean = false;
    @ViewChild('fileInput') inputEl: ElementRef;

    constructor(private http: RestService) {}

    upload() {
        let inputEl: HTMLInputElement = this.inputEl.nativeElement;
        let fileCount: number = inputEl.files.length;
        var formData = new FormData();
        if (fileCount > 0) {
            for (let i = 0; i < fileCount; i++) {
                formData.append('bulkUploadFile', inputEl.files.item(i));
            }
        this.http.setFileTemp(formData);
        }
    }
}