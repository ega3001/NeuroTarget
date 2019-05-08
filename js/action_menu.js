$(document).ready(()=>{

    // function $_GET(key) {
    //     var p = window.location.search;
    //     p = p.match(new RegExp(key + '=([^&=]+)'));
    //     return p ? p[1] : false;
    // }

    function GetQueries(){
        $.ajax({
            url: '/get_queries',
            method: 'POST',
            async: false,
            success: (data)=>{
                if(data !== 'Failed'){
                    data = JSON.parse(data);
                    // console.log(data[0][0]);
                    for (var i = data.length - 1; i >= 0; i--) {
                        $('<li id='+data[i][0]+'><a href="/filter?que='+data[i][0]+'&name='+data[i][1]+'"><i class="fas fa-arrow-circle-right"></i>'+ '&nbsp;&nbsp;&nbsp;' + data[i][1]+'</a></li>').appendTo('.works');
                    }
                }
            }
        });
    };

    GetQueries();
    // $(".list-group-item .active").removeClass("active");
    // if($_GET('que')) $('#'+$_GET('que')).addClass("active");

    $('#exit').click(()=>{
        $.ajax({
            url: '/logout',
            method: 'POST',
            error: ()=>{
                console.log('Logout failed');
            },
            success: (ans)=>{
                console.log(ans);
                location = '/';
            }
        })
    });
});