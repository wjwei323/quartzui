import { Component, Injectable, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import * as addDays from 'date-fns/add_days';
import * as getISOWeek from 'date-fns/get_iso_week';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NzNotificationService, NzTreeModule, NzModalService, NzButtonModule } from 'ng-zorro-antd';
import { environment } from '../../../environments/environment';
import { ThrowStmt } from '@angular/compiler';
import { TranslateService } from '@ngx-translate/core';
import { Util } from '../../../shared/util';
import { Router } from '@angular/router';
import { MyHttpService } from '../../../shared/myhttp';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {

  validateJobForm: FormGroup;
  isJobVisible: boolean;
  isVisible: boolean;
  jobGroupName: any;
  jobGroupDescribe: any;
  isCron = true;
  modalTitle = "新增任务";
  breadcrumbtasklist = "任务列表";
  title = 'app';
  private baseUrl = environment.baseUrl;// "http://localhost:52725";   开发的时候可以先设置本地接口地址
  public resultData: any = [{}];
  dateFormat = 'yyyy/MM/dd';
  jobInfoEntity: any = {};
  refreshValue: any = 10 * 1000;
  showPass = false;
  showPassIocUrl: string = "/assets/images/yanjing1.png";
  editJobInfoEntity: any;
  time_run_1: boolean;
  get_1: any;
  time_out_1;
  jobLoading: boolean;

  constructor(
    private fb2: FormBuilder,
    private notification: NzNotificationService,
    private translate: TranslateService,
    private router: Router,
    private http: MyHttpService,
    private modalService: NzModalService) {
    this.loadJobInfo();
    this.renovateJobInfo();
  }

  ngOnInit(): void {
    this.time_run_1 = true;
    this.getRefreshInterval();
    this.validateJobForm = this.fb2.group({
      jobName: [null, [Validators.required]],
      beginTime: [null, [Validators.required]],
      endTime: [],
      cron: [null, [Validators.required]],
      requestUrl: [null, [Validators.required]],
      requestType: [null, [Validators.required]],
      requestParameters: [],
      description: [],
      jobGroup: [null, [Validators.required]],
      triggerType: ['1', [Validators.required]],
      intervalSecond: [],
      intervalUnit: ['1'],
      headers: [],
      mailMessage: ['0']
    });
  }

  //页面销毁前执行
  ngOnDestroy() {
    this.time_run_1 = false;
  }

  isShwoPass = false;
  searchData() {
    this.isShwoPass = !this.isShwoPass;
  }

  getRefreshInterval() {
    var url = this.baseUrl + "/api/Seting/GetRefreshInterval";
    this.http.post(url, {}, (result: any) => {
      this.refreshValue = result.intervalTime * 1000;
    }, (err) => {

    });
  }

  //移除本次异常记录
  onClose(name, group) {
    //event.preventDefault();//紧张默认行为(这里可以禁止关闭)
    event.stopPropagation();//停止传播 
    var url = this.baseUrl + "/api/Job/RemoveErrLog";
    this.http.post(url, { name: name, group: group }, (result: any) => {

    }, (err) => {

    });
  }

  afterClose() {
    //alert("afterClose");
  }
  //加载
  loadJobInfo(isReset?) {
    var url = this.baseUrl + "/api/Job/GetAllJob";
    this.http.get(url,
      (result: any) => {
        result.forEach(element => {
          element.active = localStorage.getItem(element.groupName);
        });
        result.forEach(item => {
          item.jobInfoList.forEach(eleJob => {
            switch (eleJob.requestType) {
              case "1":
                eleJob.requestTypeDispaly = "Get";
                break;
              case "2":
                eleJob.requestTypeDispaly = "Post";
                break;
              case "4":
                eleJob.requestTypeDispaly = "Put";
                break;
              case "8":
                eleJob.requestTypeDispaly = "Delete";
                break;
            }
            this.setStateColor(eleJob);
          });
        });
        this.resultData = result;

        if (isReset !== false)
          this.formReset();
      }, (err) => {
      });
  }

  //刷新
  renovateJobInfo() {
    var url = this.baseUrl + "/api/Job/GetAllJobBriefInfo";
    if (this.get_1) this.get_1.unsubscribe();//丢弃上次未完成的异步请求
    this.get_1 = this.http.get(url, (result: any) => {
      this.resultData.forEach(element => {
        var jobs = result.find(t => t.groupName === element.groupName);
        element.jobInfoList && element.jobInfoList.forEach(eleJob => {
          var jobs = result.find(t => t.groupName === element.groupName).jobInfoList;
          var job = jobs.find(t => t.name === eleJob.name);
          //更新部分数据
          eleJob.previousFireTime = job.previousFireTime;
          eleJob.nextFireTime = job.nextFireTime;
          eleJob.lastErrMsg = job.lastErrMsg;
          eleJob.displayState = job.displayState;
          eleJob.runNumber = job.runNumber;
          this.setStateColor(eleJob);
        });
      });
      this.time_renovateJobInfo();
    }, (err) => {
      this.time_renovateJobInfo();
    });
  }

  //定时刷新
  time_renovateJobInfo() {
    if (this.time_out_1) clearTimeout(this.time_out_1);
    this.time_out_1 = setTimeout(() => {
      if (this.time_run_1)
        this.renovateJobInfo()
    }, this.refreshValue);
  }

  //设置状态颜色
  setStateColor(eleJob) {
    switch (eleJob.displayState) {
      case "正常":
        eleJob.stateColor = "blue";
        break;
      case "暂停":
        eleJob.stateColor = "volcano";
        break;
      case "完成":
        eleJob.stateColor = "green";
        break;
      case "异常":
        eleJob.stateColor = "magenta";
        break;
      case "阻塞":
        eleJob.stateColor = "gold";
        break;
      case "不存在":
        eleJob.stateColor = "purple";
        break;
    }
    eleJob.stateTranslate = 'task.list.table.th.tag.' + eleJob.displayState;
  }

  showJobModal(groupName) {
    this.isJobVisible = true;
    this.jobInfoEntity.jobGroup = groupName;

    if (this.modalTitle === "新增任务") {
      this.jobInfoEntity.beginTime = new Date();
    }
    if (this.translate.currentLang === "en") {
      if (this.modalTitle === "新增任务")
        this.modalTitle = "Add Task";
      else if (this.modalTitle === "编辑任务")
        this.modalTitle = "Editor Task";
    }
  }

  //取消
  handleJobCancel() {
    this.isJobVisible = false;
    this.modalTitle = "新增任务";
    this.formReset();
  }

  //验证
  validata() {
    for (const i in this.validateJobForm.controls) {
      this.validateJobForm.controls[i].markAsDirty();
      this.validateJobForm.controls[i].updateValueAndValidity();
    }
  }

  //重置
  formReset() {
    this.validateJobForm.reset();
    this.validateJobForm.controls["triggerType"].setValue("1");
    this.validateJobForm.controls["intervalUnit"].setValue("1");
    this.validateJobForm.controls["mailMessage"].setValue("0");
  }

  //新增-编辑 计划任务
  handleJobOk() {
    /*  e.stopPropagation();
     e.preventDefault(); */
    var url, entity: any;

    if (!this.validateJobForm.valid) {
      this.validata();
      if (!this.validateJobForm.valid)
        return;
    }
    this.jobInfoEntity.intervalSecond = this.jobInfoEntity.intervalSecond * parseInt(this.validateJobForm.controls["intervalUnit"].value);
    this.jobInfoEntity.mailMessage = this.validateJobForm.value.mailMessage;

    //编辑
    if (this.modalTitle === "编辑任务" || this.modalTitle === "Editor Task") {
      url = this.baseUrl + "/api/Job/ModifyJob";
      entity = {
        NewScheduleEntity: this.jobInfoEntity,
        OldScheduleEntity: this.editJobInfoEntity
      }
    }
    else {//新增
      url = this.baseUrl + "/api/Job/AddJob";
      entity = this.jobInfoEntity;
    }

    this.jobLoading = true;
    this.http.post(url, entity, (result: any) => {
      if (result.code == 200) {
        this.msgInfo("保存任务计划成功！");
        this.loadJobInfo();
        this.isJobVisible = false;
      }
      else {
        this.msgWarning(result.msg);
      }
      this.jobLoading = false;
    }, (err) => {
      this.msgError("保存任务计划失败！");
      this.jobLoading = false;
    });
  }

  //编辑任务
  editJob(name, group) {
    if (this.translate.currentLang === "en")
      this.modalTitle = "Editor Task";
    else
      this.modalTitle = "编辑任务";
    var url = this.baseUrl + "/api/Job/QueryJob";
    this.http.post(url, { name: name, group: group }, (result: any) => {
      this.jobInfoEntity = result;
      this.validateJobForm.controls["mailMessage"].setValue(result.mailMessage.toString());
      this.jobInfoEntity.requestType = this.jobInfoEntity.requestType.toString();
      this.jobInfoEntity.triggerType = this.jobInfoEntity.triggerType.toString();

      this.editJobInfoEntity = JSON.parse(JSON.stringify(this.jobInfoEntity));
      this.isJobVisible = true;
    }, (err) => {

    });
  }

  copyJob(name, group) {
    if (this.translate.currentLang === "en")
      this.modalTitle = "Add Task";
    else
      this.modalTitle = "新增任务";
    var url = this.baseUrl + "/api/Job/QueryJob";
    this.http.post(url, { name: name, group: group }, (result: any) => {
      this.jobInfoEntity = result;
      this.validateJobForm.controls["mailMessage"].setValue(result.mailMessage.toString());
      this.jobInfoEntity.requestType = this.jobInfoEntity.requestType.toString();
      this.jobInfoEntity.triggerType = this.jobInfoEntity.triggerType.toString();

      this.editJobInfoEntity = JSON.parse(JSON.stringify(this.jobInfoEntity));
      this.isJobVisible = true;
    }, (err) => {

    });
  }

  //暂停
  stopJob(job, group) {
    var name = job.name;
    var url = this.baseUrl + "/api/Job/StopJob";
    job.bt_suspended_loading = true;
    this.http.post(url, { name: name, group: group }, (result: any) => {
      this.msgInfo(result.msg);
      this.renovateJobInfo();
      job.bt_suspended_loading = false;
    }, (err) => {
      job.bt_suspended_loading = false;
    });
  }

  //恢复
  resumeJob(job, group) {
    var name = job.name;
    var url = this.baseUrl + "/api/Job/ResumeJob";
    job.bt_restore_loading = true;
    this.http.post(url, { name: name, group: group }, (result: any) => {
      if (result.code == 200)
        this.msgInfo(result.msg);
      else
        this.msgWarning(result.msg);
      this.renovateJobInfo();
      job.bt_restore_loading = false;
    }, (err) => {
      job.bt_restore_loading = false;
    });
  }

  //删除
  removeJob(name, group) {

    var url = this.baseUrl + "/api/Job/RemoveJob";
    this.http.post(url, { name: name, group: group }, (result: any) => {
      this.msgInfo(result.msg);
      this.loadJobInfo();
    }, (err) => {

    });
  }

  //修改触发器类型时
  changeTriggerType(triggerType) {
    if (triggerType === "1") {//cron
      this.isCron = true;
      this.validateJobForm.controls["intervalSecond"].setValidators(null);
      this.validateJobForm.controls["cron"].setValidators(Validators.required);
    }
    else if (triggerType === "2") {//Simple
      this.isCron = false;
      this.validateJobForm.controls["cron"].setValidators(null);
      this.validateJobForm.controls["intervalSecond"].setValidators(Validators.required);
    }
  }

  //立即执行
  triggerJob(name, group) {
    var url = this.baseUrl + "/api/Job/TriggerJob";
    this.http.post(url, { name: name, group: group }, (result: any) => {
      this.msgInfo("执行成功！");
      this.renovateJobInfo();
    }, (err) => {
      this.msgError("执行失败！");
    });
  }

  //查看日志
  getJobLogs(name, group) {
    var url = this.baseUrl + "/api/Job/GetJobLogs";
    this.http.post(url, { name: name, group: group }, (result: any) => {
      if (result === null) {
        this.msgWarning("暂无日志！");
        return;
      }
      var logs = result.join("");
      /*result.forEach(element => {
        //logs += "<p>" + element + "</p>" 
      }); */
      this.translate.get("task.list.table.th.button.日志")
        .subscribe(title => {
          this.modalService.create({
            nzTitle: title,
            nzContent: logs,
            nzFooter: null,
            nzBodyStyle: {
              "max-height": '500px',
              "overflow-y": "auto"
            }
          });
        });
    }, (err) => {
      this.msgError("查询失败！");
    });
  }

  //切换 折叠任务组
  clickPanel(active, groupName) {
    localStorage.setItem(groupName, active);
  }

  showModalMsg(title, content) {
    this.translate.get("task.list.table.th.tag." + title)
      .subscribe(title => {
        this.modalService.create({
          nzTitle: title,
          nzContent: content,
          nzFooter: null,
          nzBodyStyle: {
            "max-height": '500px',
            "overflow-y": "auto"
          }
        });
      });
  }

  switchPass() {
    this.showPass = !this.showPass;
    this.showPassIocUrl = this.showPass ? "/assets/images/yanjing1.png" : "/assets/images/yanjing2.png";
  }

  msgError(str): void {
    this.notification.error(str, "")
  }
  msgInfo(str): void {
    this.notification.info(str, "")
  }
  msgSuccess(str): void {
    this.notification.success(str, "")
  }
  msgWarning(str): void {
    this.notification.warning(str, "")
  }
}
