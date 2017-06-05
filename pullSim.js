var width = 480;
var height = 320;

var PERSON_WIDTH = 75;
var PERSON_HEIGHT = 150;

var EFFECT_WIDTH = 32;
var EFFECT_HEIGHT = 32;

var GRAPH_COUNT = 1000;

var Person = function(){
    this.engaged = 0;
    this.boredomFactor = 0.5 + Math.random() * 1;
    this.effects = [];
    this.rect = [(width - PERSON_WIDTH) / 2, (height - PERSON_HEIGHT) / 2, PERSON_WIDTH, PERSON_HEIGHT];
};

Person.prototype.checkLeave = function(){
    return (this.engaged > -5) && (this.engaged < 5);
};

Person.prototype.update = function(interval){
    this.engaged -= interval * this.boredomFactor;
    this.effects = _.filter(this.effects, effect => effect.update(interval));
    return this.checkLeave();
};

Person.prototype.addEngagement = function(engagement){
    this.engaged += engagement;
    for (var i = 0; i < engagement; i += 0.2){
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

    var indicatorX = width * (this.engaged + 5) / 10;

    ctx.drawImage(getImage('smiley'), indicatorX, 14);
    
    var image = getImage('person');
    ctx.drawImage(image, this.rect[0], this.rect[1]);
    _.each(this.effects, effect => effect.draw(ctx));
};

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
        this.person = new this.person.next();
    }
    return true;
};

Sim1.prototype.draw = function(){
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, width, height);
    this.person.draw(this.ctx);
};

Sim1.prototype.initialize = function(){
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
    this.click2Engagment = 5;
};

Sim1c.prototype.click1 = Sim1.prototype.click;

Sim1c.prototype.click2 = function(){
    if (this.person.addEngagement){
        this.person.addEngagement(this.click2Engagment);
        this.click2Engagment = max(this.click2Engagment - 0.5, 0);
    }
};

var Sim2System = function(eps){
    this.timeToEngage = 1;
    this.eps = eps;
};

Sim2System.prototype.update = function(people, interval){
    this.timeToEngage -= interval * this.eps / 10;
    if (this.timeToEngage < 0){
        _.each(people, (person) => person.addEngagement(1));
        this.timeToEngage = 1;
    }
};

var Sim2 = function(){
    this.canvas = $('#sim2')[0];
    this.ctx = this.canvas.getContext('2d');
    this.graph = $('#graph2')[0];
    this.graphCtx = this.graph.getContext('2d');
    var that = this;
    $('#input2').on('change', function(newValue){
        that.updateFreq($(this).val());
    });
};

Sim2.prototype.update = function(interval){
    if (!this.person.update(interval)){
        this.person = new this.person.next();
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
        var pos = [i * 2, height * (1 - this.dataPoints[i])];
        this.graphCtx.lineTo(pos[0], pos[1]);
    }
    this.graphCtx.stroke();
};

Sim2.prototype.initialize = function(){
    this.person = new EnteringPerson();
    this.system = new Sim2System(0);
    this.updateFreq(0);
};

Sim2.prototype.updateFreq = function(newValue){
    this.system.eps = newValue;
    this.calculateGraph();
};

Sim2.prototype.calculateGraph = function(){
    var people = _.map(_.range(GRAPH_COUNT), () => new Person());
    var system = new Sim2System(this.system.eps);
    this.dataPoints = [];
    for (var i = 0; i < width; i += 2){
        for (var j = 0; j < 10; j++){
            people = _.filter(people, (person) => person.update(0.1));
            system.update(people, 0.1);
        }
        this.dataPoints.push(people.length / GRAPH_COUNT);
    }
};

var App = function(){
    this.sims = [
        new Sim1(),
        new Sim1c(),
        new Sim2()
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
