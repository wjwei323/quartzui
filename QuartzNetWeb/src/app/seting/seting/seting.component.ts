import { Component, OnInit } from '@angular/core';

import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import * as addDays from 'date-fns/add_days';
import * as getISOWeek from 'date-fns/get_iso_week';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NzNotificationService, NzTreeModule, NzModalService, NzMessageService } from 'ng-zorro-antd';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Util } from '../../../shared/util';
import { MyHttpService } from '../../../shared/myhttp';

@Component({
  selector: 'app-seting',
  templateUrl: './seting.component.html',
  styleUrls: ['./seting.component.css']
})
export class SetingComponent implements OnInit {
  validateForm: FormGroup;
  refreshValue = 10;
  private baseUrl = environment.baseUrl;
  oldPassword: any;
  newPassword: any;

  constructor(private fb: FormBuilder,
    private router: Router,
    private http: MyHttpService,
    private message: NzMessageService) { }

  ngOnInit() {
    this.getRefreshInterval();
    this.validateForm = this.fb.group({
      mailFrom: [null, [Validators.required]],
      mailPwd: [null, [Validators.required]],
      mailHost: [null, [Validators.required]],
      mailTo: [null, [Validators.required]],
    });

    var url = this.baseUrl + "/api/Seting/GetMailInfo";
    this.http.post(url, {}, (result: any) => {
      this.validateForm.controls.mailFrom.setValue(result.mailFrom);
      this.validateForm.controls.mailPwd.setValue(result.mailPwd);
      this.validateForm.controls.mailHost.setValue(result.mailHost);
      this.validateForm.controls.mailTo.setValue(result.mailTo);
    }, (err) => {

    });
  }

  //更新表单对有效值的验证
  updateValue(): void {
    for (const i in this.validateForm.controls) {
      this.validateForm.controls[i].markAsDirty();
      this.validateForm.controls[i].updateValueAndValidity();
    }
  }

  handleOk() {
    this.updateValue();
    if (!this.validateForm.valid)
      return;

    var url = this.baseUrl + "/api/Seting/SaveMailInfo";
    this.http.post(url, this.validateForm.value, (result: any) => {
      this.message.success("保存成功！");
    }, (err) => {
      this.message.warning("保存失败！");
    });
  }

  testMail() {
    var url = this.baseUrl + "/api/Seting/SendMail";
    this.http.post(url, { Title: "任务调度测试邮件", Content: "任务调度测试邮件发送成功！", MailInfo: this.validateForm.value }, (result: any) => {
      this.message.success("发送成功，请在邮箱查收！");
    }, (err) => {
      this.message.error("发送失败！");
    });
  }

  saverefresh() {
    var url = this.baseUrl + "/api/Seting/SaveRefreshInterval";
    this.http.post(url, { IntervalTime: this.refreshValue }, (result: any) => {
      this.message.success("保存成功");
    }, (err) => {
      this.message.error("保存失败");
    });
  }

  getRefreshInterval() {
    var url = this.baseUrl + "/api/Seting/GetRefreshInterval";
    this.http.post(url, {}, (result: any) => {
      this.refreshValue = result.intervalTime;
    }, (err) => {

    });
  }

  seaveLogin() {
    var url = this.baseUrl + "/api/Seting/SaveLoginInfo";
    this.http.post(url, {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword,
    }, (result: any) => {
      if (result) {
        this.message.success("保存成功");
        this.oldPassword = "";
        this.newPassword = "";
        Util.SetStorage("userInfo", {});
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 700);
      }
      else
        this.message.warning("保存失败，旧密码不对。");
    }, (err) => {

    });
  }
}
