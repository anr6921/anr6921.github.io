// TITLE PAGE
function pop(bubble)
{
    //http://soundbible.com/2067-Blop.html
    var pop = new Audio("pop.wav");
    pop.play();
    var bub = bubble;
    bub.style.display="none";

}


// GRAPHIC 1 
var $ball = document.getElementById("drop-ball");

//move down
function moveDown()
{
    /*var x = document.getElementById('drop-ball');
    var top = parseInt(x.style.top);
    x.style.top = top +12+"px";
    console.log(x.style.top);*/
    document.getElementById("drop-ball").animate([
        //keyframes
        {transform: 'translateY(0px)'},
        {transform: 'translateY(250px)'}
    ], {
        //timing
        duration:1000
    });
}

// GRAPHIC 2
function showContent(project)
{
    var lightOnDiv = document.getElementById('light-on');
    var lightOffDiv = document.getElementById('light-off');
    //https://www.soundjay.com/switch-sounds-1.html
    var sound = new Audio("switch-1.wav");
    sound.play();

    switch(project)
    {
        case 'light-on': 
        lightOnDiv.style.display='initial';
        lightOffDiv.style.display='none';
        document.body.style.backgroundColor ="#bfbfbf";
        
        break;
        case 'light-off':
        lightOnDiv.style.display='none';
        lightOffDiv.style.display='initial';
        document.body.style.backgroundColor ="grey";
        break;
    }
}