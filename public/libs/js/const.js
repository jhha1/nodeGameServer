
Dropzone.autoDiscover = false;

$(document).ready(function () {

    $('#tableUploader1').hide();

    printCategoryList($('#selected_category_name').val(), $('#category_list').val());
    //printTableList($('#selected_table_name').val(), $('#table_list').val());

    $('.nav-link').click(function () {
        var tabId = this.id.split('-')[0];
        $('#tabId').val(tabId);
        if (tabId === 'check') {
            $('#tableUploader1').hide();
            $('#categorySearch').show();
            $('#tableSearch1').show();
            $('#constTableList').show();

            printCategoryList($('#selected_category_name').val(), $('#category_list').val());
            //printTableList($('#selected_table_name').val(), $('#table_list').val());
        } else {
            $('#categorySearch').hide();
            $('#tableSearch1').hide();
            $('#constTableList').hide();
            $('#tableUploader1').show();
        }
    });

    $('#categorySearch').click(function () {
        printCategoryList($('#const_select_category').val(), $('#category_list').val());
    });

    $('#tableSearch').click(function () {
        printTableList($('#const_select_table').val(), $('#table_list').val());
    });

    var category;
    var table;

    function printCategoryList(selected_category_name, category_list) {
        $('#const_select_category option').remove();
        $('#const_select_table option').remove();
        
        category_list = JSON.parse(category_list);
        console.log("!!!!!!!!!!!!!!!!!!!!"); console.log(category_list);

        let selectedCategoryName = [];
        for (var i = 0; i < category_list.length; i++) {
            if (category_list[i][0] === selected_category_name) {
                selectedCategoryName = category_list[i][0];
            }
            $("#const_select_category").append(new Option(selectedCategoryName, selectedCategoryName));
        }

        $("#const_select_category").val(selected_category_name).attr("selected", "selected");

        $("#const_select_category").select2({
            theme: 'bootstrap4',
        });
    }

    if ($('#tableSearch').length > 0) {
        $.ajax({
            url: '/const/listTables',
            type: 'post',
            data: {
                "category": selected_category_name
            },
            success: function (data) {
                swal('실행 완료', '', 'success').then(function () {
                    printTableList(data, '');
                });
            },
            error: function () {
                swal('error', 'something wrong..', 'error');
            },
        });

    }

    function printTableList(table_list, selected_table_name) {
        $('#const_select_table option').remove();

        table_list = JSON.parse(table_list);

        let selectedData = [];
        for (var i = 0; i < table_list.length; i++) {
            if (table_list[i].sheetName === selected_table_name) {
                selectedData = table_list[i];
            }
            $("#const_select_table").append(new Option(table_list[i].sheetName, table_list[i].sheetName));
        }

        if (selectedData.length === 0) {
            selected_table_name = table_list[0].sheetName;
            selectedData = table_list[0];
        }

        $("#const_select_table").val(selected_table_name).attr("selected", "selected");

        $("#const_select_table").select2({
            theme: 'bootstrap4',
        });

        if (table) {
            table.destroy();
            $('#const_table').empty();
        }

        let valueObjects = [];
        for (let value of selectedData.values) {
            let object = {};
            for (let i = 0; i < selectedData.header.length; i++) {
                object[selectedData.header[i]] = value[i];
            }
            valueObjects.push(object);
        }

        table = $('#const_table').DataTable({
            columnDefs: [{
                "defaultContent": "-",
                "targets": "_all"
            }],
            paging: false,
            info: false,
            serverSide: false,
            retrieve: true,
            data: valueObjects,
            columns: selectedData.header.map(function (item) {
                return {
                    title: item,
                    data: item
                };
            }),
            bFilter: false,
        });
    }

    if ($('#tableUploader').length > 0) {
        $.ajax({
            url: '/const/compareTables',
            type: 'get',
            data: {
            },
            success: function (data) {
                swal('실행 완료', '', 'success').then(function () {
                    printCompareTableData(data, $('#compare_table_list').val());
                });
            },
            error: function () {
                swal('error', 'something wrong..', 'error');
            },
        });
    }

    function printCompareTableData(data, table_list) {
        data = JSON.parse(data);

        let added = data['added'];
        let deleted = data['deleted'];
        let changed = data['changed'];

        let changedHeader = changed;

    }
});

/*
 $('#logDownload').click(function () {
        location.replace("/convert/log-download");
    });

  $('#dbtojson').click(function () {
        $.ajax({
            url: '/convert/refreshJSON',
            type: 'get',
            data: {
                env: $('#envValue').val(),
            },
            success: function () {
                swal('실행 완료', '', 'success').then(function () {
                    requestTableData($('#envValue').val(), $('#init_table').val());
                });
            },
            error: function () {
                swal('error', 'something wrong..', 'error');
            },
        });
    });

    $(document).on("click", "#dbcopy", function () {
        swal("정말 카피하시겠습니까??", '', 'warning', {
            buttons: ["아니요", "예"],
        }).then(function (result) {
            if (!result) {
                return swal("취소되었습니다", '', 'info');
            }
            $('#loader').show();
            $.ajax({
                url: '/convert/dbcopy',
                type: 'get',
                data: {
                    env: $('#envValue').val(),
                },
                success: function () {
                    swal('실행 완료', '', 'success').then(function () {
                        $('#loader').hide();
                        requestTableData($('#envValue').val(), $('#init_table').val());
                    });
                },
                error: function (e) {
                    swal('error', JSON.stringify(e), 'error');
                },
            });
        });
    });

   $('.nav-link').click(function () {
        var env = this.id.split('-')[0];
        $('#envValue').val(env);
        if (env !== 'DEVELOP') {
            $('#dbcopy').remove();
            let name = "DEVELOP";

            if (env === 'AWS_OPEN') {
                name = "STAGE";
            }
            $('#buttonGroup').append('<button class="form-control btn-brand ml-2" type="button" id="dbcopy">'+ name +' 데이터를 ' + env + '에 복사</button>')
        } else {
            $('#dbcopy').remove();
        }
        requestTableData(env, $('#init_table').val());
    });

 */