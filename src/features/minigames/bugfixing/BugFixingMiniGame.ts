import {MiniGame} from "../MiniGame";
import * as ko from "knockout";
import {BugFixingRequirement} from "./BugFixingRequirement";
import {BugFixingMiniGameSaveData} from "./BugFixingMiniGameSaveData";
import {ObservableArrayProxy} from "../../../engine/knockout/ObservableArrayProxy";
import {Bug} from "./Bug";
import {MiniGameUpgrade} from "../MiniGameUpgrade";
import {Currency} from "../../wallet/Currency";
import {CurrencyType} from "../../wallet/CurrencyType";
import {MiniGameUpgradeType} from "../MiniGameUpgradeType";
import {App} from "../../../App";


export class BugFixingMiniGame extends MiniGame {
    name: string = "Bug Fixing";
    saveKey: string = "bug-fixing";

    private readonly _squashed: ko.Observable<number>;

    private readonly _actualCursor: ko.Observable<number>;

    public bugs: ObservableArrayProxy<Bug>;

    currentMonthTime: number = 0;
    movementSpeed: number = 0.1;
    lastLaneSpawned: number = 1;

    constructor(budgetRequirement: number) {
        super(budgetRequirement);
        this._squashed = ko.observable(0);
        this.yearRequirements = [];
        this._actualCursor = ko.observable(1);
        this.bugs = new ObservableArrayProxy<Bug>([]);
    }

    initialize(): void {
        this.yearRequirements.push(new BugFixingRequirement("Quality Assurance - Fix bugs", 1000, 100))

        this.upgrades.push(new MiniGameUpgrade('bug-fixing-movement-cost', "Reduce the cost of switching lanes by 30%", new Currency(100, CurrencyType.money), 0.70, MiniGameUpgradeType.BugFixingMoveCost));
        this.upgrades.push(new MiniGameUpgrade('bug-fixing-value-1', "Improve bug value by 50%", new Currency(100, CurrencyType.money), 1.50, MiniGameUpgradeType.BugFixingValue));
        this.upgrades.push(new MiniGameUpgrade('bug-fixing-value-2', "Improve bug value by 50%", new Currency(150, CurrencyType.money), 1.50, MiniGameUpgradeType.BugFixingValue));
        this.upgrades.push(new MiniGameUpgrade('bug-fixing-remove-lane', "Remove a lane", new Currency(150, CurrencyType.money), 1.00, MiniGameUpgradeType.BugFixingReduceLane));
        this.upgrades.push(new MiniGameUpgrade('bug-fixing-spawn-1', "Bugs spawn 25% more often", new Currency(100, CurrencyType.money), 1.25, MiniGameUpgradeType.BugFixingSpawn));
        this.upgrades.push(new MiniGameUpgrade('bug-fixing-spawn-2', "Bugs spawn 25% more often", new Currency(150, CurrencyType.money), 1.25, MiniGameUpgradeType.BugFixingSpawn));

        this.spawnBug();
    }

    getBugsOnLane(lane: number): Bug[] {
        return this.bugs.filter(bug => bug.lane == lane);
    }

    moveUp(): void {
        if (App.game.wallet.hasCurrency(this.getSwitchCost())) {
            App.game.wallet.loseCurrency(this.getSwitchCost());
            this.actualCursor = Math.max(0, this.actualCursor - 1);
        }
    }

    moveDown(): void {
        if (App.game.wallet.hasCurrency(this.getSwitchCost())) {
            App.game.wallet.loseCurrency(this.getSwitchCost());
            this.actualCursor = Math.min(this.getLaneCount() - 1, this.actualCursor + 1);
        }
    }

    // In months
    getSpawnTime(): number {
        return 0.1 * this.getTotalMultiplierForType(MiniGameUpgradeType.BugFixingSpawn) * App.game.prestige.skillTree.getTotalMultiplierForType(MiniGameUpgradeType.BugFixingSpawn);
    }
    getSwitchCost(): Currency {
        return new Currency(10 * this.getTotalMultiplierForType(MiniGameUpgradeType.BugFixingMoveCost) * App.game.prestige.skillTree.getTotalMultiplierForType(MiniGameUpgradeType.BugFixingMoveCost), CurrencyType.money);
    }

    private getLaneCount(): number {
        return Math.max(0, 4 - this.getBoughtUpgradesOfType(MiniGameUpgradeType.BugFixingReduceLane).length - App.game.prestige.skillTree.getBoughtUpgradesOfType(MiniGameUpgradeType.BugFixingReduceLane).length);
    }

    private getSquashValue() {
        return this.getTotalMultiplierForType(MiniGameUpgradeType.BugFixingValue) * App.game.prestige.skillTree.getTotalMultiplierForType(MiniGameUpgradeType.BugFixingValue);
    }

    update(delta: number): void {
        const monthDelta: number = App.game.yearTracker.secondsToMonthPercentage(delta);
        this.currentMonthTime+= monthDelta;

        this.bugs.forEach((bug, index) => {
            bug.position -= 2 * monthDelta;
            if (bug.position <= 0) {
                if (bug.lane == this.actualCursor) {
                    this.squashed += this.getSquashValue();
                }
                this.bugs.splice(index, 1);
            }
        });

        if (this.currentMonthTime >= this.getSpawnTime()) {
            this.currentMonthTime = 0;
            this.spawnBug();
        }
    }

    spawnBug(): void {
        const shouldSwitch = Math.random() < 0.25;
        const newLane = Math.floor(Math.random() * this.getLaneCount());
        const lane = shouldSwitch ? this.lastLaneSpawned : newLane;

        this.lastLaneSpawned = lane;
        this.bugs.push(new Bug(1, lane));
    }

    load(data: BugFixingMiniGameSaveData): void {
        this.squashed = data.squashed
    }

    parseSaveData(json: Record<string, unknown>): BugFixingMiniGameSaveData {
        return new BugFixingMiniGameSaveData(json?.squashed as number ?? 0);
    }

    reset(): void {
        this.squashed = 0;
    }

    save(): BugFixingMiniGameSaveData {
        return new BugFixingMiniGameSaveData(this.squashed);
    }

    // Knockout getters/setters
    get squashed(): number {
        return this._squashed();
    }

    set squashed(value: number) {
        this._squashed(value);
    }

    get actualCursor(): number {
        return this._actualCursor();
    }

    set actualCursor(value: number) {
        this._actualCursor(value);
    }

}
