// In your Javascript (external .js resource or <script> tag)

var draggable = vuedraggable
Vue.use(draggable)

const Select2 = {
    props: ["options", "value"],
    template: "<select><slot></slot></select>",
    mounted: function () {
        var vm = this;
        $(this.$el)
            // init select2
            .select2({
                data: this.options
            })
            .val(this.value)
            .trigger("change")
            // emit event on change.
            .on("change", function () {
                vm.$emit("input", this.value);
            });
    },
    watch: {
        value: function (value) {
            // update value
            $(this.$el)
                .val(value)
                .trigger("change");
        },
        options: function (options) {
            // update options
            $(this.$el)
                .empty()
                .select2({
                    data: options,
                    matcher: matchWordFromStart
                });
        }
    },
    destroyed: function () {
        $(this.$el)
            .off()
            .select2("destroy");
    }
};
window.cluster_string = "";
window.vue_obj = new Vue({
    el: "#app",
    components: {
        draggable,
        Select2
    },
    data() {
        return {
            list1: [
              { name: "+", id: 1, type: 'operator' },
              { name: "-", id: 2, type: 'operator' },
              { name: "*", id: 3, type: 'operator' },
              { name: "(", id: 4, type: 'operator' },
              { name: ")", id: 5, type: 'operator' }
            ],
            list2: [
            ],            
            options: [
              { id: 1, text: 'People', type: 'tag'},
              { id: 2, text: 'World', type: 'tag' },
              { id: 3, text: 'Auto', type: 'cluster' },
              { id: 4, text: 'Color', type: 'cluster' },
              { id: 5, text: 'Man', type: 'cluster' },
              { id: 6, text: 'Hair', type: 'tag' },
              { id: 7, text: 'Black', type: 'tag' },
            ],
            selected: 1,
            string: ""
        };
    },
    methods: {
        removeAt(idx) {
            this.list2.splice(idx, 1);
          },
          add: function() {
            var obj = {
              id: Object.keys(this.list2).length,
              name: this.options[this.selected-1].text,
              type: this.options[this.selected-1].type
            }
            this.list2.push(obj);
          },
          addOperator: function(event) {
            var obj = {
              id: Object.keys(this.list2).length,
              name: event.target.innerHTML,
              type: 'operator'
            }
            this.list2.push(obj);
          },
          convertStr: function(){
            this.string = ""
            for(var i in this.list2){
              switch (this.list2[i].type) {
                case 'tag':
                  this.string += "t_"+this.list2[i].name+";"
                  break
                case 'cluster':
                  this.string += "c_"+this.list2[i].name+";"
                  break
                case 'operator':
                  console.log(this.list2[i].name);
                  this.string += this.convert(this.list2[i].name.trim())+";"
                  break;
              }
            }
            this.string = this.string.slice(0, -1);
            offset = 0; // определена в filter.js
            curPhotosPageNum = 1;  // определена в filter.js
            ShowPhotos(this.string, offset);
            HideTable();
            window.cluster_string = this.string;
        },
        createCluster: function(){
            this.string = ""
            for(var i in this.list2){
              switch (this.list2[i].type) {
                case 'tag':
                  this.string += "t_"+this.list2[i].name+";"
                  break
                case 'cluster':
                  this.string += "c_"+this.list2[i].name+";"
                  break
                case 'operator':
                  console.log(this.list2[i].name);
                  this.string += this.convert(this.list2[i].name.trim())+";"
                  break;
              }
            }
            this.string = this.string.slice(0, -1);
            SaveCluster(this.string);
            //не сохраняем т.к. этом может повлиять на отображение статистики
        },
        convert: function (t) {
            switch (t) {
                case "+":
                    return "OR";
                case "-":
                    return "DIFF";
                case "*":
                    return "AND";
                default:
                    return t;
            }
        },
        createOptions: function (tags, clusters) {
            this.options = [];
            for (var i in tags) {
                this.options.push({
                    id: this.options.length + 1,
                    text: tags[i].TagName,
                    type: "tag"
                });
            }
            for (var j in clusters) {
                this.options.push({
                    id: this.options.length + 1,
                    text: clusters[j].ClusterName,
                    type: "cluster"
                });
            }
        }
    },
    mounted() {
        var tags = [];
        var clusters = [];
        $.ajax({
            url: "/get_tags_from_query",
            method: "POST",
            data: {
                query_id: $_GET('que'),
                cluster: ""
            },
            async: false,
            beforeSend: () => {
                ShowLoadWheel();
            },
            complete: () => {
                HideLoadWheel();
            },
            success: data => {
                console.log("Returned tags: " + data);
                if (data !== "Failed") {
                    data = JSON.parse(data);
                    console.log(data);
                    tags = data;
                }
            }
        });
        $.ajax({
            url: "/get_clusters",
            method: "POST",
            async: false,
            beforeSend: () => {
                ShowLoadWheel();
            },
            complete: () => {
                HideLoadWheel();
            },
            success: data => {
                console.log("Returned tags: " + data);
                if (data !== "Failed") {
                    data = JSON.parse(data);
                    console.log(data);
                    clusters = data;
                }
            }
        });
        this.createOptions(tags, clusters);
    },
});

function matchWordFromStart(params, data) {
    if ($.trim(params.term) === '') {
      return data;
    }
    if (typeof data.text === 'undefined') {
      return null;
    }
    if (data.text.toUpperCase().indexOf(params.term.toUpperCase()) === 0) {
      var modifiedData = $.extend({}, data, true);
      return modifiedData;
    }
    return null;
}

$(document).ready(function () {
    $(".js-example-basic-single").select2();
});