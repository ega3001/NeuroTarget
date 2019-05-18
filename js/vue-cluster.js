// In your Javascript (external .js resource or <script> tag)
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
                    data: options
                });
        }
    },
    destroyed: function () {
        $(this.$el)
            .off()
            .select2("destroy");
    }
};

new Vue({
    el: "#app",
    data() {
        return {
            items: [],
            selected: 1,
            options: [{
                    id: 1,
                    text: "People",
                    type: "tag"
                },
                {
                    id: 2,
                    text: "World",
                    type: "tag"
                },
                {
                    id: 3,
                    text: "Auto",
                    type: "cluster"
                },
                {
                    id: 4,
                    text: "Color",
                    type: "cluster"
                },
                {
                    id: 5,
                    text: "Man",
                    type: "cluster"
                },
                {
                    id: 6,
                    text: "Hair",
                    type: "tag"
                },
                {
                    id: 7,
                    text: "Black",
                    type: "tag"
                }
            ],
            info: null,
            tags: null,
            clusters: null,
            string: "",
            toChange: null
        };
    },
    methods: {
        addTag: function () {
            this.items.push({
                id: this.items.length,
                text: this.options[this.selected - 1].text,
                type: this.options[this.selected - 1].type
            });
        },
        addOperator: function (event) {
            this.items.push({
                id: this.items.length,
                text: event.target.innerHTML,
                type: "operator"
            });
        },
        deleteTag: function (event) {
            this.items = this.items.filter(x => {
                return x.id != event.target.id;
            });
        },
        selectTag: function (event) {
            if (this.toChange) {
                this.toChange.classList.toggle("selected");
                if (this.toChange.id == event.target.id) {
                    this.toChange = null;
                    return;
                }
            }
            for (var i in this.items) {
                if (this.items[i].id == event.target.id) {
                    event.target.classList.toggle("selected");
                    this.toChange = event.target;
                }
            }
        },
        changeTag: function (event) {
            for (var i in this.items) {
                if (this.items[i].id == this.toChange.id) {
                    this.items[i].text = this.options[this.selected - 1].text;
                    this.items[i].type = this.options[this.selected - 1].type;
                    this.toChange.classList.toggle("selected");
                    this.toChange = null;
                    break;
                }
            }
        },
        changeToOperator: function (event) {
            for (var i in this.items) {
                if (this.items[i].id == this.toChange.id) {
                    this.items[i].text = event.target.innerHTML;
                    this.items[i].type = "operator";
                    this.toChange.classList.toggle("selected");
                    this.toChange = null;
                    break;
                }
            }
        },
        createString: function () {
            this.string = "";
            for (var i in this.items) {
                switch (this.items[i].type) {
                    case "tag":
                        this.string += "t_" + this.items[i].text + ";";
                        break;
                    case "cluster":
                        this.string += "c_" + this.items[i].text + ";";
                        break;
                    case "operator":
                        this.string += this.convert(this.items[i].text) + ";";
                        break;
                }
            }
            this.string = this.string.slice(0, -1);
            //Здесь можно отправить сразу же на сервер строку this.str
            $.ajax({
                url: "/save_cluster",
                method: "POST",
                async: true,
                data: {
                    cluster_name: $(".cluster-creation-name__input").val(),
                    cluster: this.string
                },
                success: data => {
                    data = JSON.parse(data);
                    console.log(data);
                    if (!data.message) {
                        let success = '<div class="alert alert-success alert-dismissible fade show" role="alert">'
                        + '<strong>Кластер успешно создан!</strong>'
                        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
                        $('#app').after(success);
                    } else {
                        let error = '<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>'
                        + data.message
                        + '</strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
                        $('#app').after(error);
                    }
                }
            });
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
            url: "/get_tags",
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
        // var clusters = AJAX ЗАПРОС
        // this.createOptions(tags, clusters)
        this.createOptions(tags, clusters);
    },
    components: {
        Select2
    }
});
$(document).ready(function () {
    $(".js-example-basic-single").select2();
});