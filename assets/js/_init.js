/**
 * Инициализация хелпера
 */
$(function(){
    $$.$body = $('body');

    var init = {
        popup: function (context){
            Helper.bindPopup($('[js-open-popup]', context));
        },
        modal: function (context){
            Helper.bindModal($('[js-open-modal]', context));
        },
        tabs: function (){
            Helper.createTabs();
        },
        selectus: function (context){
            $('[js-selectus]', context).selectus();
        },
        formPlugins: function (context) {
            $('[js-selectus]', context).selectus();
        }
    };
    init.all = function (){
        this.popup();
        this.modal();
        this.tabs();
        this.selectus();
    };
    $$.init = init;

    $$.init.all();
});
