import * as ko from "knockout";

import {ISimpleEvent, SimpleEventDispatcher} from "ste-simple-events";
import {ISignal, SignalDispatcher} from "ste-signals";

import {Feature} from "../../engine/Feature";
import {YearTrackerSaveData} from "./YearTrackerSaveData";

export class YearTracker extends Feature {
    name: string = "Year Tracker";
    saveKey: string = 'year-tracker';

    private readonly _month: ko.Observable<number>;
    private readonly _monthProgress: ko.Observable<number>

    private readonly _onMonthEnd = new SimpleEventDispatcher<number>();
    private readonly _onMonthStart = new SimpleEventDispatcher<number>();
    private readonly _onYearStart = new SignalDispatcher();
    private readonly _onYearEnd = new SignalDispatcher();

    private readonly realMonthTime: number;
    private yearHasEnded: boolean;

    constructor(realMonthTime: number) {
        super();
        this.realMonthTime = realMonthTime;
        this.yearHasEnded = false;
        this._month = ko.observable(0);
        this._monthProgress = ko.observable(0);

    }

    initialize(): void {
        this.startNewYear();
    }

    startNewYear(): void {
        this.reset();
        this._onYearStart.dispatch();
        this._onMonthStart.dispatch(0);
    }

    update(delta: number): void {
        if (this.yearHasEnded) {
            return;
        }
        this.monthProgress += delta / this.realMonthTime;
        if (this.monthProgress >= 1) {
            this.nextMonth();
        }
    }

    reset(): void {
        this.month = 0;
        this.monthProgress = 0;
        this.yearHasEnded = false;
    }

    nextMonth(): void {
        if (this.yearHasEnded) {
            console.error("Cannot go to next month when year is ended");
        }

        this._onMonthEnd.dispatch(this.month);
        this.month++;
        this.monthProgress = 0;
        this._onMonthStart.dispatch(this.month);

        // 11 is the last year, so 12 after incrementing
        if (this.month == 12) {
            this.yearEnd();
        }

    }

    yearEnd(): void {
        this.yearHasEnded = true;
        this._onYearEnd.dispatch();
    }

    load(data: YearTrackerSaveData): void {
        this.month = data.month;
        this.monthProgress = data.monthProgress
    }

    parseSaveData(json: Record<string, unknown>): YearTrackerSaveData {
        const month = json?.month as number ?? 0;
        const monthProgress = json?.monthProgress as number ?? 0;
        return new YearTrackerSaveData(month, monthProgress);
    }

    save(): YearTrackerSaveData {
        return new YearTrackerSaveData(this.month, this.monthProgress);
    }

    // Event getters/setters
    public get onMonthStart(): ISimpleEvent<number> {
        return this._onMonthStart.asEvent();
    }

    public get onMonthEnd(): ISimpleEvent<number> {
        return this._onMonthEnd.asEvent();
    }

    public get onYearStart(): ISignal {
        return this._onYearStart.asEvent();
    }

    public get onYearEnd(): ISignal {
        return this._onYearEnd.asEvent();
    }

    // Knockout getters/setters
    get month(): number {
        return this._month();
    }

    set month(value: number) {
        this._month(value);
    }

    get monthProgress(): number {
        return this._monthProgress();
    }

    set monthProgress(value: number) {
        this._monthProgress(value);
    }
}
