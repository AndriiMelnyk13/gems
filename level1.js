Game.level1 = function(game){

    var Game;
    var GEM_SIZE = 100;
    var GEM_SPACING = 2;
    var GEM_COLOR = 6;
    var GEM_SIZE_SPACED = GEM_SIZE + GEM_SPACING;
    var BOARD_COLS;
    var BOARD_ROWS;
    var MATCH_MIN = 3;
    var gems;
    var selectedGem = null;
    var selectedGemStartPos;
    var selectedGemTween;
    var tempShiftedGem = null;
    var allowInput;
    var score = 0;
    var scoreText;
    var startButton;
    var bgm;
    var killM;
    var restartB;
    var shadows;
    var scored;

};

Game.level1.prototype = {

    preload: function(){

        game.load.spritesheet("GEMS", "assets/diamonds100x6.png", GEM_SIZE, GEM_SIZE);
        game.load.image('background', 'assets/backgrounds/background.jpg');
        game.load.image('scored', 'assets/bg-score.png');
        game.load.image('bigShadow', 'assets/big-shadow.png');
        game.load.image('restartB', 'assets/restartB.png');
        game.load.image('timeUp', 'assets/text-timeup.png');
        game.load.image('shadows', 'assets/game/shadow.png');
        game.load.image('hand', 'assets/hand.png');

        game.load.audio('bgm', 'assets/audio/background.mp3');
        game.load.audio('killM', 'assets/audio/kill.mp3');

    },
    create: function() {

        game.add.image(0, 0, 'background');
        scored = game.add.image(570, 50, 'scored');
        scored.scale.set(0.5);

        scoreText = game.add.text(670, 80, '0', { font: "30px Fredoka One", fill: "#ffffff", align: "center" });

        restartB = game.add.button(700, 300, 'restartB');

        killM = game.add.audio('killM');

        var me = this;
        me.startTime = new Date();
        me.totalTime = 45;
        me.timeElapsed = 1;
        me.gameTimer = game.time.events.loop(100, function(){
            me.updateTimer();
        });
        me.timeLabel = me.game.add.text(700, 200, "00:00", {font: "50px Fredoka One", fill: "black"});
        me.timeLabel.anchor.setTo(0.5, 0);
        me.timeLabel.align = 'center';

        restartB.inputEnabled = true;
        restartB.events.onInputDown.add(this.restart, this);

        spawnBoard();

        selectedGemStartPos = { x: 0, y: 0 };
        allowInput = false;
        game.input.addMoveCallback(slideGem, this);

    },

    updateTimer: function(){

        var me = this;

        var currentTime = new Date();
        var timeDifference = me.startTime.getTime() - currentTime.getTime();

        me.timeElapsed = Math.abs(timeDifference / 1000);
        var timeRemaining = me.totalTime - me.timeElapsed;
        var minutes = Math.floor(timeRemaining / 60);
        var seconds = Math.floor(timeRemaining) - (60 * minutes);
        var result = (minutes < 10) ? "0" + minutes : minutes;
        result += (seconds < 10) ? ":0" + seconds : ":" + seconds;

        me.timeLabel.text = result;
        if (timeRemaining <= 0){
            game.add.image(200, 200, 'timeUp');
            me.timeLabel.kill();
            gems.kill();


        }

    },

    releaseGem: function(){

        if (tempShiftedGem === null) {
            selectedGem = null;
            return;
        }
        var canKill = checkAndKillGemMatches(selectedGem);
        canKill = checkAndKillGemMatches(tempShiftedGem) || canKill;

        if (! canKill)
        {
            var gem = selectedGem;

            if (gem.posX !== selectedGemStartPos.x || gem.posY !== selectedGemStartPos.y)
            {
                if (selectedGemTween !== null)
                {
                    game.tweens.remove(selectedGemTween);
                }

                selectedGemTween = tweenGemPos(gem, selectedGemStartPos.x, selectedGemStartPos.y);

                if (tempShiftedGem !== null)
                {
                    tweenGemPos(tempShiftedGem, gem.posX, gem.posY);
                }

                swapGemPosition(gem, tempShiftedGem);

                tempShiftedGem = null;

            }
        }

        removeKilledGems();

        var dropGemDuration = dropGems();

        game.time.events.add(dropGemDuration * 100, refillBoard);

        allowInput = false;

        selectedGem = null;
        tempShiftedGem = null;

    },
    slideGem: function(pointer, x, y){

        if (selectedGem && pointer.isDown)
        {
            var cursorGemPosX = getGemPos(x);
            var cursorGemPosY = getGemPos(y);

            if (checkIfGemCanBeMovedHere(selectedGemStartPos.x, selectedGemStartPos.y, cursorGemPosX, cursorGemPosY))
            {
                if (cursorGemPosX !== selectedGem.posX || cursorGemPosY !== selectedGem.posY)
                {
                    if (selectedGemTween !== null)
                    {
                        game.tweens.remove(selectedGemTween);
                    }

                    selectedGemTween = tweenGemPos(selectedGem, cursorGemPosX, cursorGemPosY);

                    gems.bringToTop(selectedGem);

                    if (tempShiftedGem !== null)
                    {
                        tweenGemPos(tempShiftedGem, selectedGem.posX , selectedGem.posY);
                        swapGemPosition(selectedGem, tempShiftedGem);
                    }

                    tempShiftedGem = getGem(cursorGemPosX, cursorGemPosY);

                    if (tempShiftedGem === selectedGem)
                    {
                        tempShiftedGem = null;
                    }
                    else
                    {
                        tweenGemPos(tempShiftedGem, selectedGem.posX, selectedGem.posY);
                        swapGemPosition(selectedGem, tempShiftedGem);
                    }
                }
            }
        }
    },
    spawnBoard: function(){
        BOARD_COLS = Math.floor(game.world.width / GEM_SIZE_SPACED - 1);
        BOARD_ROWS = Math.floor(game.world.height / GEM_SIZE_SPACED);

        gems = game.add.group();
        shadows = game.add.group();

        for (var i = 0; i < BOARD_COLS; i++)
        {
            for (var j = 0; j < BOARD_ROWS; j++)
            {
                var gem = gems.create(i * GEM_SIZE_SPACED, j * GEM_SIZE_SPACED, "GEMS");
                var shadow = shadows.create(i * GEM_SIZE_SPACED, j * GEM_SIZE_SPACED, "shadows");
                gem.name = 'gem' + i.toString() + 'x' + j.toString();
                gem.inputEnabled = true;
                gem.events.onInputDown.add(selectGem, this);
                gem.events.onInputUp.add(releaseGem, this);
                randomizeGemColor(gem);
                setGemPos(gem, i, j);
                gem.kill();
                shadow.kill();
            }
        }

        removeKilledGems();

        var dropGemDuration = dropGems();

        game.time.events.add(dropGemDuration * 100, refillBoard);

        allowInput = false;

        selectedGem = null;
        tempShiftedGem = null;

    },

    selectGem: function(gem){

        if (allowInput)
        {
            selectedGem = gem;
            selectedGemStartPos.x = gem.posX;
            selectedGemStartPos.y = gem.posY;
        }

    },
    getGem: function(posX, posY){
        return gems.iterate("id", calcGemId(posX, posY), Phaser.Group.RETURN_CHILD);
    },
    getGemPos: function(coordinate){
        return Math.floor(coordinate / GEM_SIZE_SPACED);

    },
    setGemPos: function(gem, posX, posY){

        gem.posX = posX;
        gem.posY = posY;
        gem.id = calcGemId(posX, posY);

    },
    calcGemId: function(posX, posY){
        return posX + posY * BOARD_COLS;

    },
    getGemColor: function(){
        return gem.frame;

    },
    randomizeGemColor: function(gem){
        gem.frame = game.rnd.integerInRange(0, gem.animations.frameTotal - 1);

    },
    checkIfGemCanBeMovedHere: function(fromPosX, fromPosY, toPosX, toPosY){
        if (toPosX < 0 || toPosX >= BOARD_COLS || toPosY < 0 || toPosY >= BOARD_ROWS)
        {
            return false;
        }

        if (fromPosX === toPosX && fromPosY >= toPosY - 1 && fromPosY <= toPosY + 1)
        {
            return true;
        }

        if (fromPosY === toPosY && fromPosX >= toPosX - 1 && fromPosX <= toPosX + 1)
        {
            return true;
        }

        return false;
    },
    countSameColorGems: function(startGem, moveX, moveY){
        var curX = startGem.posX + moveX;
        var curY = startGem.posY + moveY;
        var count = 0;

        while (curX >= 0 && curY >= 0 && curX < BOARD_COLS && curY < BOARD_ROWS && getGemColor(getGem(curX, curY)) === getGemColor(startGem))
        {
            count++;
            curX += moveX;
            curY += moveY;
        }

        return count;
    },
    swapGemPosition: function(gem1, gem2){
        var tempPosX = gem1.posX;
        var tempPosY = gem1.posY;
        setGemPos(gem1, gem2.posX, gem2.posY);
        setGemPos(gem2, tempPosX, tempPosY);

    },
    checkAndKillGemMatches:function(gem){
        if (gem === null) { return; }

        var canKill = false;

        var countUp = countSameColorGems(gem, 0, -1);
        var countDown = countSameColorGems(gem, 0, 1);
        var countLeft = countSameColorGems(gem, -1, 0);
        var countRight = countSameColorGems(gem, 1, 0);

        var countHoriz = countLeft + countRight + 1;
        var countVert = countUp + countDown + 1;

        if (countVert >= MATCH_MIN)
        {
            killGemRange(gem.posX, gem.posY - countUp, gem.posX, gem.posY + countDown);
            score+=3;
            scoreText.text = ' ' + score;
            canKill = true;
            killM.play();
        }

        if (countHoriz >= MATCH_MIN)
        {
            killGemRange(gem.posX - countLeft, gem.posY, gem.posX + countRight, gem.posY);
            score+=3;
            scoreText.text = ' ' + score;
            canKill = true;
            killM.play();
        }

        return canKill;
    },
    killGemRange: function(fromX, fromY, toX, toY){
        fromX = Phaser.Math.clamp(fromX, 0, BOARD_COLS - 1);
        fromY = Phaser.Math.clamp(fromY , 0, BOARD_ROWS - 1);
        toX = Phaser.Math.clamp(toX, 0, BOARD_COLS - 1);
        toY = Phaser.Math.clamp(toY, 0, BOARD_ROWS - 1);

        for (var i = fromX; i <= toX; i++)
        {
            for (var j = fromY; j <= toY; j++)
            {
                var gem = getGem(i, j);
                gem.kill();
            }
        }
    },
    removeKilledGems: function(){
        gems.forEach(function(gem) {
            if (!gem.alive) {
                setGemPos(gem, -1,-1);
            }
        });
    },
    tweenGemPos: function(gem, newPosX, newPosY, durationMultiplier){

        console.log('Tween ',gem.name,' from ',gem.posX, ',', gem.posY, ' to ', newPosX, ',', newPosY);
        if (durationMultiplier === null || typeof durationMultiplier === 'undefined')
        {
            durationMultiplier = 1;
        }

        return game.add.tween(gem).to({x: newPosX  * GEM_SIZE_SPACED, y: newPosY * GEM_SIZE_SPACED}, 100 * durationMultiplier, Phaser.Easing.Linear.None, true);

    },
    dropGems: function(){
        var dropRowCountMax = 0;

        for (var i = 0; i < BOARD_COLS; i++)
        {
            var dropRowCount = 0;

            for (var j = BOARD_ROWS - 1; j >= 0; j--)
            {
                var gem = getGem(i, j);

                if (gem === null)
                {
                    dropRowCount++;
                }
                else if (dropRowCount > 0)
                {
                    gem.dirty = true;
                    setGemPos(gem, gem.posX, gem.posY + dropRowCount);
                    tweenGemPos(gem, gem.posX, gem.posY, dropRowCount);
                }
            }

            dropRowCountMax = Math.max(dropRowCount, dropRowCountMax);
        }

        return dropRowCountMax;
    },
    refillBoard: function(){
        var maxGemsMissingFromCol = 0;

        for (var i = 0; i < BOARD_COLS; i++)
        {
            var gemsMissingFromCol = 0;

            for (var j = BOARD_ROWS - 1; j >= 0; j--)
            {
                var gem = getGem(i, j);

                if (gem === null)
                {
                    gemsMissingFromCol++;
                    gem = gems.getFirstDead();
                    shadow = shadows.getFirstDead();
                    gem.reset(i * GEM_SIZE_SPACED, -gemsMissingFromCol * GEM_SIZE_SPACED);
                    gem.dirty = true;
                    randomizeGemColor(gem);
                    setGemPos(gem, i, j);
                    tweenGemPos(gem, gem.posX, gem.posY, gemsMissingFromCol * 2);
                }
            }

            maxGemsMissingFromCol = Math.max(maxGemsMissingFromCol, gemsMissingFromCol);
        }

        game.time.events.add(maxGemsMissingFromCol * 2 * 100, boardRefilled);

    },
    boardRefilled: function(){
        var canKill = false;
        for (var i = 0; i < BOARD_COLS; i++)
        {
            for (var j = BOARD_ROWS - 1; j >= 0; j--)
            {
                var gem = getGem(i, j);

                if (gem.dirty)
                {
                    gem.dirty = false;
                    canKill = checkAndKillGemMatches(gem) || canKill;
                }
            }
        }

        if(canKill){
            score+=3;
            scoreText.text = ' ' + score;
            removeKilledGems();
            var dropGemDuration = dropGems();
            game.time.events.add(dropGemDuration * 100, refillBoard);
            allowInput = false;
        } else {
            allowInput = true;
        }
    },
    update: function() {
    },
    restart:function(){
        this.state.start('level1');
        score = 0

    },

    go: function(){
        this.state.start('level1');
    }
};