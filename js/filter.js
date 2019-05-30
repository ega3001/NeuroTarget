updatePointer();
updateQueryName();

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

function ShowPhotos(tags = "") {
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
      if (!data.message) {
        console.log("Returned users: " + data);

        $(".photo").remove();
        for (let i = 0; i < data['users'].length; i++) {      // 11.03 HEAD
          $(
            '<div class="photo"><img src="' + data['users'][i]['AvatarURL'] + '"></div>'
          ).appendTo("#gallery");
        }

        $('<div style="margin-left: 10px">' + data['total_count'] + '</div>').appendTo('#users-stat'); // 11.03 HEAD
        $('#users-stat').text(data['total_count']);  // 11.03 HEAD

      }else{
        let error = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>'
        + data.message
        + '</strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
        $('#app').after(error);
      }
    }
  });
}

function ShowTable(tags = ""){
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
        // console.log(data);

        for (let i = 0; i < data.length; i++) {
          if (i <= 50) {
            $('<tr class="custom"><td>' +
                data[i]['TagName'] +
                "</td><td>"+data[i]['cnt']+'</td>'
              ).appendTo("tbody");
          } else {
            break;
          }
        }
      }else{
        let error = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>'
        + data.message
        + '</strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
        $('#app').after(error);
      }
    }
  });
}
function HideTable(){
  $('#load-stata').parent().removeClass('flex-dir-row');
  $('#load-stata').parent().addClass('flex-dir-col');
  $('#load-stata').show();
  $('.table-tags').hide();
  $(".custom").remove();
}

$('#load-stata').on('click', ()=>{
  ShowTable(cluster_string);
});

function SaveCluster(tags = ""){
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
        let success = '<div class="alert alert-success alert-dismissible fade show" role="alert">'
        + '<strong>Кластер успешно создан!</strong>'
        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
        $('#app').after(success);
      }else{
        let error = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>'
        + data.message
        + '</strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
        $('#app').after(error);
      }
    }
  });
}

$('#view-tags').on('click', ()=>{
  window.open("/view_tags?query=" +
    $_GET("que") +
    "&name=" +
    $_GET('name'), '_blank');
});

$("#save").click(function() {
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