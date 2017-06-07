var width = 480;
var height = 320;

var PERSON_WIDTH = 75;
var PERSON_HEIGHT = 150;

var EFFECT_WIDTH = 32;
var EFFECT_HEIGHT = 32;

var GRAPH_COUNT = 1000;

var Person = function(personData){
    this.engagementComponent = personData.getEngagementComponent();
    this.effects = [];
    this.rect = [(width - PERSON_WIDTH) / 2, (height - PERSON_HEIGHT) / 2, PERSON_WIDTH, PERSON_HEIGHT];
};

Person.prototype.update = function(interval){
    this.engagementComponent.update(interval);
    this.effects = _.filter(this.effects, effect => effect.update(interval));
    return this.engagementComponent.checkLeave();
};

Person.prototype.addEngagement = function(engagement){
    var effectCount = this.engagementComponent.addEngagement(engagement);
    
    for (var i = 0; i < effectCount; i++){
        this.effects.push(new SmileEffect());
    }
};

Person.prototype.click = function(){
    this.engaged += this.engagePerClick;
    this.effects.push(new SmileEffect());
};

Person.prototype.draw = function(ctx){
    ctx.fillStyle = '#330000';
    ctx.fillRect(0, 10, width, 40);

    var indicatorX = width * (this.engagementComponent.engaged + 5) / 10;

    ctx.drawImage(getImage('smiley'), indicatorX, 14);
    
    var image = getImage('person');
    ctx.drawImage(image, this.rect[0], this.rect[1]);
    _.each(this.effects, effect => effect.draw(ctx));
};

var FirstPersonData = function(){};

FirstPersonData.prototype.getEngagementComponent = function(){ return new FirstEngagementComponent(); };


var SmileEffect = function(){
    this.rect = [(width - EFFECT_WIDTH) / 2 + (Math.random() - 0.5) * EFFECT_WIDTH, 
                 (height - PERSON_HEIGHT) / 2 + (Math.random() - 0.5) * EFFECT_HEIGHT, 
                 EFFECT_WIDTH, EFFECT_HEIGHT];
};

SmileEffect.prototype.update = function(interval){
    this.rect[1] -= 100 * interval;
    return (this.rect[1] + this.rect[3]) > 0;
};

SmileEffect.prototype.draw = function(ctx){
    var image = getImage('smiley');
    ctx.drawImage(image, this.rect[0], this.rect[1]);
};

var FirstEngagementComponent = function(){
    this.engaged = 0;
    this.boredomFactor = 0.5 + Math.random() * 1;
};

FirstEngagementComponent.prototype.checkLeave = function(){
    return (this.engaged > -5) && (this.engaged < 5);
};

FirstEngagementComponent.prototype.update = function(interval){
    this.engaged -= interval * this.boredomFactor;
};

FirstEngagementComponent.prototype.addEngagement = function(engagement){
    this.engaged += engagement;
    return engagement;
};

FirstEngagementComponent.prototype.deathData = falseFunction;

var EnteringPerson = function(){
    this.timeToAnimation = 1;
};

EnteringPerson.prototype.update = function(interval){
    this.timeToAnimation -= interval;
    return this.timeToAnimation > 0;
};

EnteringPerson.prototype.draw = function(ctx){
    ctx.drawImage(getImage('person'), (width - PERSON_WIDTH) / 2, 
                  (height - PERSON_HEIGHT) / 2 + ((height + PERSON_HEIGHT) / 2 * this.timeToAnimation));
};

var LeavingPerson = function(){
    this.timeToAnimation = 1;
};

LeavingPerson.prototype.update = function(interval){
    this.timeToAnimation -= interval;
    return this.timeToAnimation > 0;
};

LeavingPerson.prototype.draw = function(ctx){
    ctx.drawImage(getImage('person'), (width - PERSON_WIDTH) / 2, 
                  (height - PERSON_HEIGHT) / 2 + ((height + PERSON_HEIGHT) / 2 * (1 - this.timeToAnimation)));
};

EnteringPerson.prototype.next = Person;
Person.prototype.next = LeavingPerson;
LeavingPerson.prototype.next = EnteringPerson;

var Sim1 = function(){
    this.canvas = $('#sim1')[0];
    this.ctx = this.canvas.getContext('2d');
    $('#sim1Inter1').click(() => this.click());
};

Sim1.prototype.update = function(interval){
    if (!this.person.update(interval)){
        this.person = new this.person.next(this.personData);
    }
    return true;
};

Sim1.prototype.draw = function(){
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, width, height);
    this.person.draw(this.ctx);
};

Sim1.prototype.initialize = function(){
    this.personData = new FirstPersonData();
    this.person = new EnteringPerson();
};

Sim1.prototype.click = function(){
    if (this.person.addEngagement){
        this.person.addEngagement(1);
    }
};

var Sim1c = function(){
    this.canvas = $('#sim1c')[0];
    this.ctx = this.canvas.getContext('2d');
    $('#sim1cInter1').click(() => this.click1());
    $('#sim1cInter2').click(() => this.click2());
};

Sim1c.prototype.update = Sim1.prototype.update;

Sim1c.prototype.draw = Sim1.prototype.draw;

Sim1c.prototype.initialize = function(){
    this.person = new EnteringPerson();
    this.personData = new FirstPersonData();
    this.click2Engagement = 5;
};

Sim1c.prototype.click1 = Sim1.prototype.click;

Sim1c.prototype.click2 = function(){
    if (this.person.addEngagement){
        this.person.addEngagement(this.click2Engagement);
        this.click2Engagement = max(this.click2Engagement - 0.5, 0);
    }
};

var Sim2System = function(eps){
    this.timeToEngage = 1;
    this.eps = eps;
};

Sim2System.prototype.update = function(people, interval){
    this.timeToEngage -= interval * this.eps / 10;
    if (this.timeToEngage < 0){
        _.each(people, (person) => this.engage(person));
        this.timeToEngage = 1;
    }
};

Sim2System.prototype.engage = function(person){ person.addEngagement(1); };

var makeChangeFunction = function(fn){
    return function(){
        var val = Number($(this).val());
        fn(val);
    };
};

var Sim2 = function(){
    this.canvas = $('#sim2')[0];
    this.ctx = this.canvas.getContext('2d');
    this.graph = $('#graph2')[0];
    this.graphCtx = this.graph.getContext('2d');
    var that = this;
    this.graphZoom = 1;
    
    $('#input2_eps').on('change', makeChangeFunction((val) => this.updateFreq(val)));
    $('#input2_zoom').on('change', makeChangeFunction((val) => this.updateZoom(val)));
};

Sim2.prototype.update = function(interval){
    if (!this.person.update(interval)){
        this.person = new this.person.next(this.personData);
    }

    if (this.person.addEngagement){
        this.system.update([this.person], interval);
    }

    return true;
};

Sim2.prototype.draw = function(){
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, width, height);
    this.person.draw(this.ctx);
    this.graphCtx.fillStyle = '#aaaaaa';
    this.graphCtx.fillRect(0, 0, width, height);
    this.graphCtx.strokeStyle = '#000000';
    this.graphCtx.strokeWidth = 2;
    this.graphCtx.beginPath();
    var startPos = [0, height * (1 - this.dataPoints[0])];
    this.graphCtx.moveTo(startPos[0], startPos[1]);
    for (var i = 1; i < this.dataPoints.length; i++){
        var pos = [i * this.graphZoom, height * (1 - this.dataPoints[i])];
        this.graphCtx.lineTo(pos[0], pos[1]);
    }
    this.graphCtx.stroke();
};

Sim2.prototype.initialize = function(){
    this.person = new EnteringPerson();
    this.personData = new FirstPersonData();
    this.system = this.getSystem();
    this.updateFreq(0);
};

Sim2.prototype.getSystem = function(){ return new Sim2System(0); };
Sim2.prototype.getGraphSystem =function(){ return new Sim2System(this.system.eps); };

Sim2.prototype.updateFreq = function(newValue){
    this.system.eps = newValue;
    this.calculateGraph();
};

Sim2.prototype.updateZoom = function(newValue){
    this.graphZoom = newValue;
    this.calculateGraph();
};

Sim2.prototype.calculateGraph = function(){
    var people = _.map(_.range(GRAPH_COUNT), () => new Person(this.personData));
    var system = this.getGraphSystem();
    this.dataPoints = [];
    this.individualData = [];
    for (var i = 0; i < width; i+=this.graphZoom){
        for (var j = 0; j < 10; j++){
            people = _.filter(people, (person) => {
                if (person.update(0.1)){
                    return true;
                }
                else{
                    this.individualData.push(person.engagementComponent.deathData());
                    return false;
                }
            });
            system.update(people, 0.1);
        }
        this.dataPoints.push(people.length / GRAPH_COUNT);
    }

    _.each(people, (person) => this.individualData.push(person.engagementComponent.deathData()));
    this.calculateData();
};

Sim2.prototype.calculateData = trueFunction;

var Sim3PersonData = function(){
    this.newVal = 2;
    this.oldVal = 0;
};

Sim3PersonData.prototype.getEngagementComponent = function(){ return new Sim3EngagementComponent(this.newVal, this.oldVal); };

var Sim3EngagementComponent = function(newVal, oldVal){
    this.newVal = newVal;
    this.oldVal = oldVal;
    this.engaged = 0;
    this.boredomFactor = 0.5 + Math.random() * 1;
    this.boredomFactor *= 4;
    this.collectedPieces = {};
};

Sim3EngagementComponent.prototype.checkLeave = function(){
    return this.engaged > -5;
};

Sim3EngagementComponent.prototype.update = FirstEngagementComponent.prototype.update;

Sim3EngagementComponent.prototype.deathData = function(){
    return {
        pulls: _.reduce(this.collectedPieces, addFunction, 0),
        pieceCount: Object.keys(this.collectedPieces).length
    };
};

Sim3EngagementComponent.prototype.addEngagement = function(engagement){
    if (this.collectedPieces[engagement]){
        this.collectedPieces[engagement] += 1;
        this.engaged += this.oldVal;
    }
    else{
        this.collectedPieces[engagement] = 1;
        this.engaged += this.newVal;
    }
};

var Sim3System = function(eps, entityCount){
    this.eps = eps;
    
    this.timeToEngage = 1;
    this.entityCount = entityCount;
};

Sim3System.prototype.update = Sim2System.prototype.update;

Sim3System.prototype.engage = function(person){ 
    person.addEngagement(Math.floor(Math.random() * this.entityCount)); 
};

var Sim3 = function(){
    this.canvas = $('#sim3')[0];
    this.ctx = this.canvas.getContext('2d');
    this.graph = $('#graph3')[0];
    this.graphCtx = this.graph.getContext('2d');
    this.graphZoom = 1;

    $('#input3_eps').on('change', makeChangeFunction((val) => this.updateFreq(val)));
    $('#input3_zoom').on('change', makeChangeFunction((val) => this.updateZoom(val)));
    $('#input3_count').on('change', makeChangeFunction((val) => this.updateCount(val)));
    $('#input3_newVal').on('change', makeChangeFunction((val) => this.updateNew(val)));
    $('#input3_oldVal').on('change', makeChangeFunction((val) => this.updateOld(val)));
};

Sim3.prototype.update = Sim2.prototype.update;
Sim3.prototype.draw = Sim2.prototype.draw;

Sim3.prototype.initialize = function(){
    this.person = new EnteringPerson();
    this.personData = new Sim3PersonData();
    this.system = this.getSystem();
    this.updateFreq(0);
};

Sim3.prototype.getSystem = function(){ return new Sim3System(0, 100); };
Sim3.prototype.getGraphSystem = function(){
    return new Sim3System(this.system.eps, this.system.entityCount);
};

Sim3.prototype.updateFreq = Sim2.prototype.updateFreq;
Sim3.prototype.updateZoom = Sim2.prototype.updateZoom;

Sim3.prototype.updateCount = function(val){
    this.system.entityCount = val;
    this.calculateGraph();
};

Sim3.prototype.updateNew = function(val){
    this.personData.newVal = val;
    this.person = new EnteringPerson();
    this.calculateGraph();
};

Sim3.prototype.updateOld = function(val){
    this.personData.oldVal = val;
    this.person = new EnteringPerson();
    this.calculateGraph();
};

Sim3.prototype.calculateGraph = Sim2.prototype.calculateGraph;

Sim3.prototype.calculateData = function(){
    var averagePulls = _.reduce(this.individualData, (memo, datum) => (memo + datum.pulls), 0) / this.individualData.length;
    var averagePieceCount = _.reduce(this.individualData, (memo, datum) => (memo + datum.pieceCount), 0) / this.individualData.length;
    this.updateData(averagePulls, averagePieceCount);
};

Sim3.prototype.updateData = function(averagePulls, averagePieceCount){
    $('#data3_1').text(averagePulls);
    $('#data3_2').text(averagePieceCount);
};

var Sim3bPersonData = function(){
    this.pieces = _.map(_.range(150), function(i){
        var rareValue = Math.floor(i / 30) + 1;
        var newVal = (rareValue * 2 + Math.random(5)) / 3;
        var oldVal = (rareValue + Math.random(2)) / 3;
        return {
            newVal: newVal,
            oldVal: oldVal,
            weight: 6 - rareValue
        };
    });
};

Sim3bPersonData.prototype.getEngagementComponent = function(){ return new Sim3bEngagementComponent(this.pieces); };

var Sim3bEngagementComponent = function(pieces){
    this.engaged = 0;
    this.boredomFactor = 0.5 + Math.random() * 1;
    this.boredomFactor *= 4;
    this.collectedPieces = {};
    this.pieces = pieces;
};

Sim3bEngagementComponent.prototype.checkLeave = Sim3EngagementComponent.prototype.checkLeave;
Sim3bEngagementComponent.prototype.update = Sim3EngagementComponent.prototype.update;
Sim3bEngagementComponent.prototype.deathData = Sim3EngagementComponent.prototype.deathData;

Sim3bEngagementComponent.prototype.addEngagement = function(engagement){
    if (this.collectedPieces[engagement]){
        this.collectedPieces[engagement] += 1;
        this.engaged += this.pieces[engagement].oldVal;
    }
    else{
        this.collectedPieces[engagement] = 1;
        this.engaged += this.pieces[engagement].newVal;
    }
};

var Sim3bSystem = function(eps, pieces){
    this.eps = eps;
    this.timeToEngage = 1;
    this.entityCount = 150;
    this.pieces = pieces;
    this.pieceWeightSum = _.reduce(this.pieces, (memo, piece) => memo + piece.weight, 0);
};

Sim3bSystem.prototype.update = Sim3System.prototype.update;

Sim3bSystem.prototype.engage = function(person){
    var pieceWeight = Math.floor(Math.random() * this.pieceWeightSum);
    
    var counter = 0;
    for (var i = 0; i < this.pieces.length; i++){
        counter += this.pieces[i].weight;
        if (counter > pieceWeight){
            person.addEngagement(i);
            break;
        }
    }
};

var Sim3b = function(){
    this.canvas = $('#sim3b')[0];
    this.ctx = this.canvas.getContext('2d');
    this.graph = $('#graph3b')[0];
    this.graphCtx = this.graph.getContext('2d');
    this.graphZoom = 1;

    $('#input3b_eps').on('change', makeChangeFunction((val) => this.updateFreq(val)));
    $('#input3b_zoom').on('change', makeChangeFunction((val) => this.updateZoom(val)));
};

Sim3b.prototype.update = Sim3.prototype.update;
Sim3b.prototype.draw = Sim3.prototype.draw;

Sim3b.prototype.initialize = function(){
    this.person = new EnteringPerson();
    this.personData = new Sim3bPersonData();
    this.system = this.getSystem();
    this.updateFreq(0);
};

Sim3b.prototype.getSystem = function(){ return new Sim3bSystem(0, this.personData.pieces); };
Sim3b.prototype.getGraphSystem = function(){
    return new Sim3bSystem(this.system.eps, this.personData.pieces);
};

Sim3b.prototype.updateFreq = Sim3.prototype.updateFreq;
Sim3b.prototype.updateZoom = Sim3.prototype.updateZoom;

Sim3b.prototype.calculateGraph = Sim3.prototype.calculateGraph;

Sim3b.prototype.calculateData = Sim3.prototype.calculateData;

Sim3b.prototype.updateData = function(averagePulls, averagePieceCount){
    $('#data3b_1').text(averagePulls);
    $('#data3b_2').text(averagePieceCount);
};

var Sim5PersonData = function(){
    this.newVal = 2;
    this.oldVal = 0;
    this.startPulls = 0;
    this.count = 100;
};

Sim5PersonData.prototype.getEngagementComponent = function(){
    return new Sim5EngagementComponent(this);
};

var Sim5EngagementComponent = function(personData){
    this.newVal = personData.newVal;
    this.oldVal = personData.oldVal;
    
    this.boredomFactor = 0.5 + Math.random() * 1;
    this.boredomFactor *= 4;

    this.collectedPieces = {};

    for (var i = 0; i < personData.startPulls; i++){
        this.addEngagement(Math.floor(Math.random() * personData.count));
    }

    this.engaged = 0;
    this.pulls = 0;
    this.pieceCount = 0;
};

Sim5EngagementComponent.prototype.checkLeave = Sim3EngagementComponent.prototype.checkLeave;
Sim5EngagementComponent.prototype.update = Sim3EngagementComponent.prototype.update;

Sim5EngagementComponent.prototype.deathData = function(){
    return {
        pulls: this.pulls,
        pieceCount: this.pieceCount
    };
};

Sim5EngagementComponent.prototype.addEngagement = function(engagement){
    this.pulls += 1;
    if (this.collectedPieces[engagement]){
        this.collectedPieces[engagement] += 1;
        this.engaged += this.oldVal;
    }
    else{
        this.collectedPieces[engagement] = 1;
        this.engaged += this.newVal;
        this.pieceCount += 1;
    }
};

var Sim5 = function(){
    this.canvas = $('#sim5')[0];
    this.ctx = this.canvas.getContext('2d');
    this.graph = $('#graph5')[0];
    this.graphCtx = this.graph.getContext('2d');
    this.graphZoom = 1;

    this.oldCount = 100;
    this.newCount = 0;

    $('#input5_eps').on('change', makeChangeFunction((val) => this.updateFreq(val)));
    $('#input5_zoom').on('change', makeChangeFunction((val) => this.updateZoom(val)));
    $('#input5_count').on('change', makeChangeFunction((val) => this.updateCount(val)));
    $('#input5_newCount').on('change', makeChangeFunction((val) => this.updateNewCount(val)));
    $('#input5_startPulls').on('change', makeChangeFunction((val) => this.updateStartPulls(val)));
    $('#input5_newVal').on('change', makeChangeFunction((val) => this.updateNew(val)));
    $('#input5_oldVal').on('change', makeChangeFunction((val) => this.updateOld(val)));
};

Sim5.prototype.draw = Sim3.prototype.draw;
Sim5.prototype.update = Sim3.prototype.update;

Sim5.prototype.initialize = function(){
    this.person = new EnteringPerson();
    this.personData = new Sim5PersonData();
    this.system = this.getSystem();
    this.updateFreq(0);
};

Sim5.prototype.getSystem = Sim3.prototype.getSystem;
Sim5.prototype.getGraphSystem = Sim3.prototype.getGraphSystem;

Sim5.prototype.updateFreq = Sim3.prototype.updateFreq;
Sim5.prototype.updateZoom = Sim3.prototype.updateZoom;

Sim5.prototype.updateCount = function(val){
    this.oldCount = val;
    this.system.entityCount = this.newCount + this.oldCount;
    this.personData.count = val;
    this.calculateGraph();
};

Sim5.prototype.updateNewCount = function(val){
    this.newCount = val;
    this.system.entityCount = this.newCount + this.oldCount;
    this.calculateGraph();
};

Sim5.prototype.updateStartPulls = function(val){
    this.personData.startPulls = val;
    this.person = new EnteringPerson();
    this.calculateGraph();
};

Sim5.prototype.updateNew = Sim3.prototype.updateNew;
Sim5.prototype.updateOld = Sim3.prototype.updateOld;

Sim5.prototype.calculateGraph = Sim3.prototype.calculateGraph;
Sim5.prototype.calculateData = Sim3.prototype.calculateData;

Sim5.prototype.updateData = function(averagePulls, averagePieceCount){
    $('#data5_1').text(averagePulls);
    $('#data5_2').text(averagePieceCount);
};

var Sim6aPersonData = Sim3PersonData;

var App = function(){
    this.sims = [
        new Sim1(),
        new Sim1c(),
        new Sim2(),
        new Sim3(),
        new Sim3b(),
        new Sim5()
    ];
    _.each(this.sims, sim => sim.initialize());
};

App.prototype.update = function(interval){
    this.sims = _.filter(this.sims, sim => sim.update(interval));
    return true;
};

App.prototype.draw = function(){
    _.each(this.sims, sim => sim.draw());
};

var getFrameFunctions = function(){
    app = new App();
    return {
        update: function(){
            var interval = timeFeed.getInterval();
            return app.update(interval);
        },
        draw: function(){
            app.draw();
        }
    };
};

var main = function(){
    var functions = getFrameFunctions();
    var tickFun = function(){
        var cont = functions.update();
        functions.draw();
        if (cont){
            requestAnimFrame(tickFun);
        }
    };
    tickFun();
};

window.onload = main;
