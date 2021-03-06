import { AuthService } from './../service/auth.service';
import jwt_decode from 'jwt-decode';
import { TimeSlotService } from './../service/timeslot.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit,OnDestroy {


  currentDay: number = 0;
  currentDate: Date = new Date();
  dateToShow:Date  = this.currentDate
  days: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  daysNumbers?: any[][];
  OnlyWorkDay: boolean = false;
  appointSubscription!: Subscription;
  timeSlotsSubscription!: Subscription;
  appointments!: any[];
  timeSlots!: any[];
  timeslotsClicked: any[] = [];
  title: string = '';
  open:boolean = false;
  userid!: string;
  users!: any[];
  userSubscription!: Subscription;
  current_user = this.authService.user_data.user_id;
  selected_enterprise: any;



  constructor(private timeSlotService:TimeSlotService,public authService:AuthService) { 

  }
  ngOnDestroy(): void {
    if (this.timeSlotsSubscription) {
      this.timeSlotsSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async ngOnInit() {
    if (this.authService.isAuth()) {
      this.authService.getCurrentUser();
      this.timeSlotsSubscription = this.timeSlotService.TimeSlotSuject.subscribe(async (timeSlot: any[]) => {
        let temp = await this.timeSlotService.getTimeSlots('')
        this.timeSlots = temp.filter(data => data.info != "Cancelled")

        this.daysNumbers = this.setCalendar(this.currentDate);
      })
      this.timeSlotService.emitTimeSlotSubject();
      this.userSubscription = this.authService.userSubject.subscribe(async (users: any[]) => {
        let temp = await this.authService.getUsers('Enterprise')
        this.users = temp.filter(us => us.uuid != this.current_user);
      })
      this.authService.emitUsers();
  
    }
  }

  async updateTimeSlot(event: Event) {
    let enterprise = (event.target as HTMLTextAreaElement).value
    this.timeSlotService.filter_userid= [this.current_user,enterprise];
    let temp = await this.timeSlotService.getTimeSlots('')
    this.timeSlots = temp.filter(data => data.info != "Cancelled")
    this.daysNumbers = this.setCalendar(this.currentDate);
  }

  


  //back to current date
  initCalendar() {
    this.dateToShow = this.currentDate;
    this.daysNumbers = this.setCalendar(this.dateToShow)
  }

  //get next month
  getNextMonth() {
    if (this.dateToShow.getMonth() == 11) {
      this.dateToShow = new Date(this.dateToShow.getFullYear() + 1, 0, 1);
      this.daysNumbers = this.setCalendar(this.dateToShow)
  } else {
      this.dateToShow = new Date(this.dateToShow.getFullYear(), this.dateToShow.getMonth() + 1, 1);
      this.daysNumbers = this.setCalendar(this.dateToShow)
    }
  }

  getPreviousMonth() {
    if (this.dateToShow.getMonth() == 0) {
      this.dateToShow = new Date(this.dateToShow.getFullYear() - 1, 11, 1);
      this.daysNumbers = this.setCalendar(this.dateToShow)
  } else {
      this.dateToShow = new Date(this.dateToShow.getFullYear(), this.dateToShow.getMonth() - 1, 1);
      this.daysNumbers = this.setCalendar(this.dateToShow)
    }
  }

  //create calendar
  setCalendar(date: Date) {
    let lastDay = this.getLastDayOfMonth(date);
    let daysNumber = this.range(1, lastDay+1, 1);
    let dayToAddBefore = this.adjustCalendar(new Date(date.getFullYear(), date.getMonth(), 1),"Before");
    let dayToAddAfter = this.adjustCalendar(new Date(date.getFullYear(), date.getMonth(), lastDay), "After");
    let daysNumberDict = this.dayToColor(daysNumber,date,"black","")
    if (dayToAddBefore) {
      let dayToAddBeforeDict = this.dayToColor(dayToAddBefore,date,"#94a3b8","Before")
          daysNumberDict = [...dayToAddBeforeDict,...daysNumberDict];
    }
    if (dayToAddAfter) {
      let dayToAddAfterDict = this.dayToColor(dayToAddAfter,date,"#94a3b8","After")
      daysNumberDict = [...daysNumberDict,...dayToAddAfterDict]
    }


    for (let index in daysNumberDict) {
      for (let index3 in this.timeSlots) {
        if (daysNumberDict[index].day === this.timeSlots[index3].date.getDate() && daysNumberDict[index].month === this.timeSlots[index3].date.getMonth() &&
          daysNumberDict[index].year === this.timeSlots[index3].date.getFullYear()) {
          daysNumberDict[index].timeSlots.push(this.timeSlots[index3])
        }
      }
    }


    
    let daysNumbers = this.transformTo7(daysNumberDict);


    return daysNumbers;
  }


  //add color to each cell
  dayToColor(array: any[], date: Date, color: String, type: string) {

    let month = date.getMonth();
    let year = date.getFullYear();

    //month and year correction
    if (type === "Before") {
      year = month === 0 ? year-1 : year;
      month = month === 0 ? 11 : month-1;
    }
    if (type === "After") {
      year = month === 11 ?  year + 1 :  year
      month =  month === 11 ?   0 :  month+1
    }
    return array.map(d => ({
      day: d,
      month: month,
      year:year,
      color: this.currentDate.getDate() === d && this.currentDate.getMonth() == month ? "#6A0DAD" : color,
      timeSlots: Array()
    }))
  }

  //range like in python
  range = (start:number, stop:number, step:number) => {
    // manipulation with arguments
    const itemsCout = Math.ceil((stop - start) / step)
    return [...Array(itemsCout)].map((_value, index) => index*step+start)
  };

  //return last day of a month
  getLastDayOfMonth(date: Date) {
    let year = date.getFullYear()
    let month = date.getMonth()
    let day = 31;
    let temp = new Date(year, month, day);
    while (temp.getMonth() !== month) {
      day = day - 1;
      temp = new Date(year, month, day);
    }

    return day;
    
  }

  //adjust the calendar by adding previous or next month days to keep a square shape
  adjustCalendar(date: Date, type: string) {

    if (type === "Before") {
      let firstDay = date.getDay();
      if (firstDay != 1) {
        if (firstDay == 0) firstDay = 7;
        const numberOfDayLeft = firstDay - 1;
        if (date.getMonth() == 0) {
          let lastDay = this.getLastDayOfMonth(new Date(date.getFullYear() - 1, 11, 1));
          return this.range(lastDay - numberOfDayLeft + 1, lastDay + 1, 1);
        } else {
          let lastDay = this.getLastDayOfMonth(new Date(date.getFullYear(), date.getMonth() - 1, 1));
          return this.range(lastDay - numberOfDayLeft + 1, lastDay + 1, 1);
        }
      } else {
        return;
      }
    } else if (type === "After") {
      let lastDay = date.getDay();
      if (lastDay != 0) {
        const numberOfDayLeft = 7 - lastDay;
        return this.range(1, numberOfDayLeft + 1, 1)
      } else {
        return;
      }
    } else {
      return;
    }


  }

  //transform array to small arrays of 7 elements -> easier to map rows
  transformTo7(array: any[]) {
    if(array.length % 7 !== 0) return;
    
    let temp = [];
    let arrays = array.length / 7;
    for (let i = 0; i < arrays; i++){
      temp.push(array.slice(7*i,7*i+7))
    }
    return temp;
  }

  bookTimeSlot() {

    this.timeSlotService.bookTimeSlot(this.timeslotsClicked[0],this.title);
  }

  setOpen(app: any) {
    console.log(app);
    this.timeslotsClicked.push(app)
    this.open = true;
  }

  setClose() {
    this.open = false;
    this.timeslotsClicked.pop();
  }

  getMessage() {
    return this.timeSlotService.message;
  }

}
