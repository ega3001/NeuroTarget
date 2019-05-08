$(document).ready(() => {
    $("#range1").jRange({
        from: 0,
        to: 100,
        step: 5,
        scale: [0,20,40,60,80,100],
        format: '%s',
        width: 300,
        showLabels: true,
        snap: true
    });

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

});