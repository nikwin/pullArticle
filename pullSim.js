var width = 480;
var height = 320;

var PERSON_WIDTH = 75;
var PERSON_HEIGHT = 150;

var Person = function(){
    this.engaged = 0;
    this.boredomFactor = 0.5 + Math.random() * 1;
    this.engagePerClick = 1;
    this.effects = [];
    this.rect = [(width - PERSON_WIDTH) / 2, (height - PERSON_HEIGHT) / 2, PERSON_WIDTH, PERSON_HEIGHT];
};

Person.prototype.checkLeave = function(){
    return (this.engaged > -5) && (this.engaged < 5);
};

Person.prototype.update = function(interval){
    this.engaged -= interval * this.boredomFactor;
    _.filter(this.effects, effect => effect.update(interval));
    return this.checkLeave();
};

Person.prototype.click = function(){
    this.engaged += this.engagePerClick;
    //Also add an effect here.
};

Person.prototype.draw = function(ctx){
    var image = getImage('person');
    ctx.drawImage(image, this.rect[0], this.rect[1]);
    _.each(this.effects, effect => effect.draw(ctx));
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
    console.log('clicked');
    if (this.person.click){
        this.person.click();
    }
};

var App = function(){
    this.sims = [new Sim1()];
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
