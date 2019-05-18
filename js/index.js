function ShowLoadWheel() {
    $(".loader-wrapper").css("display", "flex");
    $("body").addClass("body-in-load");
};

function HideLoadWheel() {
    $(".loader-wrapper").css("display", "none");
    $("body").removeClass("body-in-load");
};

$(".menu-trigger").on("click", function(){

    let sidebar = $(".sidebar");

    let content = $(".content");

    let left = parseInt($(sidebar).css("left").slice(0, -2));

    if(left === 0){

        $(sidebar).css("left", "-240px");

        $(content).css("margin-left", "0")

    }

    else {

        $(sidebar).css("left", "0px");

        $(content).css({"margin-left": "240px"});

    }

});



$(".works li").click(function() {

    $(".fas.fa-arrow-circle-right.active").removeClass("active");

    $(this).children(".fas.fa-arrow-circle-right").addClass("active");

});