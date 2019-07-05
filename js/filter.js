updatePointer();
updateQueryName();

const PHOTOS_NUM_ON_PAGE = 100;
ShowPhotos();

HideTable();

function $_GET(key) {
    let p = window.location.search;
    p = p.match(new RegExp(key + "=([^&=]+)"));
    return p ? p[1] : false;
}

function getXmlHttp() {
    var xmlhttp;
    try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
        try {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (E) {
            xmlhttp = false;
        }
    }
    if (!xmlhttp && typeof XMLHttpRequest != "undefined") {
        xmlhttp = new XMLHttpRequest();
    }
    return xmlhttp;
}

function updatePointer() {
    $(".fas.fa-arrow-circle-right.active").removeClass("active");
    $("#" + $_GET("que")).find(".fas.fa-arrow-circle-right").addClass("active");
}

function updateQueryName() {
    var queryName = $("#" + $_GET("que")).find("a").text().substr(3);
    $("#title").prepend("<h2>" + queryName + "</h2>");
}

var curPhotosPageNum = 1;
var maxPhotosPageNum;
var offset;

function ShowPhotos(tags = "", offset = 0) {
    $(".photo").remove();
    console.log("REMOVE");

    console.log("Tags: " + tags);
    $.ajax({
        // url: "http://virtserver.swaggerhub.com/neurotarget/simple/1.0.0/get_users_from_query",
        url: "get_users_from_query",
        method: "POST",
        async: true,
        data: {
            query_id: $_GET("que"),
            cluster: tags,
            offset: offset,
            photosNumOnPage: PHOTOS_NUM_ON_PAGE
        },
        beforeSend: () => {
            ShowLoadWheel();
        },
        complete: () => {
            HideLoadWheel();
        },
        success: data => {
            data = JSON.parse(data);
            console.log(data);
            console.log("Returned users: " + data);

            maxPhotosPageNum = Math.ceil(data['total_count'] / PHOTOS_NUM_ON_PAGE);
            clearPhotos();
            setTotalUsersNumber(data['total_count']);
            appendPhotosToGallery(data['users']);
            setPhotosPageNumbers(curPhotosPageNum);
        }
    });

    function setTotalUsersNumber(number) {
        $('<div style="margin-left: 10px">' + number + '</div>').appendTo('#users-stat');
        $('#users-stat').text(number);
    }
}

function appendPhotosToGallery(users) {
    for (let i = 0; i < users.length; i++) {
        $(
            '<div class="photo"><img src="' + users[i]['AvatarURL'] + '"></div>'
        ).appendTo("#gallery");
    }
}

function setPhotosPageNumbers(curNum) {
    $('.photos-pages_cur').text(curNum);

    let leftBorder = Math.max(1, curNum - 3);
    let rigthBorder = Math.min(curNum + 3, maxPhotosPageNum);
    for (let i = leftBorder; i <= rigthBorder; i++) {
        $('<div class="photos-page-number photos-page-number-' + i + '">' + i + '</div>').appendTo('.photos-pages-numbers-wrapper');
    }

    $('.photos-page-number').each(function() {
        $(this).on('click', function(){
            let num = parseInt($(this).text());
            curPhotosPageNum = num;
            offset = (curPhotosPageNum - 1) * PHOTOS_NUM_ON_PAGE;
            let tags = window.vue_obj.string;
            ShowPhotos(tags, offset);
        })
    })
}

function clearPhotos() {
    $(".photo").remove();
    $(".photos-pages_cur").text("");
    $(".photos-page-number").remove();
}

$('.photos-pages_next').on('click', function() {
    if (curPhotosPageNum == maxPhotosPageNum) return;
    offset = curPhotosPageNum * PHOTOS_NUM_ON_PAGE;
    let tags = window.vue_obj.string; // см. vue-filter.js метод convertStr
    curPhotosPageNum++;
    ShowPhotos(tags, offset);
})

$('.photos-pages_prev').on('click', function() {
    if (curPhotosPageNum == 1) return;
    curPhotosPageNum--;
    let offset = (curPhotosPageNum - 1) * PHOTOS_NUM_ON_PAGE;
    let tags = window.vue_obj.string; // см. vue-filter.js метод convertStr
    ShowPhotos(tags, offset);
})


var TagsAndCntObjList;
var minTagIdOnPage; // [minIdOnPage; maxIdOnPage), то есть maxIdOnPage - первый id следующей страницы
var maxTagIdOnPage;
var curTagsPageNum;
var maxTagsPageNum;
const TAGS_PER_PAGE = 51;

function ShowTable(tags = "", isDescent=true) {
    $('#load-stata').parent().removeClass('flex-dir-col');
    $('#load-stata').parent().addClass('flex-dir-row');
    $('#load-stata').hide();
    $('.table-tags').show();

    $.ajax({
        // url: "http://virtserver.swaggerhub.com/neurotarget/simple/1.0.0/get_tags_stat_from_query",
        url: "/get_tags_stat_from_query",
        method: "POST",
        async: true,
        data: {
            query_id: $_GET("que"),
            cluster: tags,
            isDescent: isDescent
        },
        beforeSend: () => {
            ShowLoadWheel();
        },
        complete: () => {
            HideLoadWheel();
        },
        success: data => {
            console.log(data);
            data = JSON.parse(data);
            console.log("Returned tags: " + data);
            TagsAndCntObjList = data;    
            minTagIdOnPage = 0;
            maxTagIdOnPage = Math.min(TAGS_PER_PAGE, TagsAndCntObjList.length);
            curTagsPageNum = 1;
            maxTagsPageNum = Math.ceil(TagsAndCntObjList.length / TAGS_PER_PAGE);
            setTagsPageNumbers(curTagsPageNum);
            if (!data.message) {
                // console.log(data);
                appendTagsToTable(minTagIdOnPage, maxTagIdOnPage);
            } else {
                let error = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>' +
                    data.message +
                    '</strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
                $('#app').after(error);
            }
        }
    });
}

function setTagsPageNumbers(curNum) {
    $('.tags-pages_cur').text(curNum);

    let leftBorder = Math.max(1, curNum - 3);
    let rigthBorder = Math.min(curNum + 3, maxTagsPageNum);
    for (let i = leftBorder; i <= rigthBorder; i++) {
        $('<div class="tags-page-number tags-page-number-' + i + '">' + i + '</div>').appendTo('.tags-pages-numbers-wrapper');
    }

    $('.tags-page-number').each(function() {
        $(this).on('click', function(){
            let num = parseInt($(this).text());
            curTagsPageNum = num;
            minTagIdOnPage = (curTagsPageNum - 1) * TAGS_PER_PAGE;
            maxTagIdOnPage = Math.min(minTagIdOnPage + TAGS_PER_PAGE, TagsAndCntObjList.length);
            clearTagsTable();
            setTagsPageNumbers(curTagsPageNum);
            appendTagsToTable(minTagIdOnPage, maxTagIdOnPage);
        })
    })
}

function appendTagsToTable(from, to) {
    for (let i = from; i < to; i++) {
        console.log(to);
        $('<tr class="custom">' +
            '<td>' + TagsAndCntObjList[i]['TagName'] + '</td>' +
            "<td>" + TagsAndCntObjList[i]['cnt'] + '</td>' +
          '</tr>'
        ).appendTo("tbody");
    }
}

function nextPage() {
    if (maxTagIdOnPage == TagsAndCntObjList.length) return;
    minTagIdOnPage = maxTagIdOnPage;
    maxTagIdOnPage = Math.min(maxTagIdOnPage + TAGS_PER_PAGE, TagsAndCntObjList.length);
    clearTagsTable();
    curTagsPageNum++;
    setTagsPageNumbers(curTagsPageNum);
    appendTagsToTable(minTagIdOnPage, maxTagIdOnPage);
}

function prevPage() {
    if (minTagIdOnPage == 0) return;
    maxTagIdOnPage = minTagIdOnPage;
    minTagIdOnPage = Math.max(0, minTagIdOnPage - TAGS_PER_PAGE);
    clearTagsTable();
    curTagsPageNum--;
    setTagsPageNumbers(curTagsPageNum);
    appendTagsToTable(minTagIdOnPage, maxTagIdOnPage);
}

function clearTagsTable() {
    $(".custom").remove();
    $(".tags-pages_cur").text("");
    $(".tags-page-number").remove();
}

$(".tags-pages_prev").on("click", ()=>{
    prevPage();
})

$(".tags-pages_next").on("click", ()=>{
    nextPage();
})

function HideTable() {
    $('#load-stata').parent().removeClass('flex-dir-row');
    $('#load-stata').parent().addClass('flex-dir-col');
    $('#load-stata').show();
    $('.table-tags').hide();
    clearTagsTable();
}

$('.tags-order').on('click', () => {
    changeTagsOrder();
    let isDescent = isDescentTagsOrder();
    console.log("isDecent:", isDescent);
    clearTagsTable();
    ShowTable(cluster_string, isDescent);

    function changeTagsOrder() {
        let text = $('.tags-order').text();
        if (text == "По убыванию") {
            $('.tags-order').text("По возрастанию");
        }
        else if (text == "По возрастанию") {
            $('.tags-order').text("По убыванию");
        }
    }
});

$('#load-stata').on('click', () => {
    let isDescent = isDescentTagsOrder();
    ShowTable(cluster_string, isDescent);
});

function isDescentTagsOrder() {
    return $('.tags-order').text() == "По убыванию";
}

function SaveCluster(tags = "") {
    $.ajax({
        url: "/save_cluster",
        method: "POST",
        async: true,
        data: {
            cluster_name: $('#nameCluster').val(),
            cluster: tags
        },
        beforeSend: () => {
            ShowLoadWheel();
        },
        complete: () => {
            HideLoadWheel();
        },
        success: data => {
            data = JSON.parse(data);
            console.log("Returned tags: " + data);
            if (!data.message) {
                let success = '<div class="alert alert-success alert-dismissible fade show" role="alert">' +
                    '<strong>Кластер успешно создан!</strong>' +
                    '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
                $('#app').after(success);
            } else {
                let error = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>' +
                    data.message +
                    '</strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
                $('#app').after(error);
            }
        }
    });
}

$('#view-tags').on('click', () => {
    window.open("/view_tags?query=" +
        $_GET("que") +
        "&name=" +
        $_GET('name'), '_blank');
});

$("#save").click(function () {
    $("#cancel").click();

    document.location =
        "/save_users_from_query?query_id=" +
        $_GET("que") +
        "&cluster=" +
        cluster_string;
});

$("#mnBT").click(() => {
    let sidebar = $(".sidebar");
    if ($(sidebar).css("left") == "-240px") {
        $(sidebar).css("left", "240px");
    } else {
        $(sidebar).css("left", "-240px");
    }
});