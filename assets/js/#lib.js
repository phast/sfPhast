(function(){
/**
 * Хэлпер с глобальными функциями
 */
var Lib = {
    window: $(window),
    isMobile: (/iphone|ipad|ipod|android|blackberry|mini|windowssce|palm/i.test(navigator.userAgent)),
    uniFormBlackout: function($overlayParent){
        var $overlay, static = $overlayParent.css('position') == 'static';

        if(static){
            $overlayParent.css('position', 'relative');
        }

        $overlay = $('<div class="form-overlay"></div>').appendTo($overlayParent);
        $overlay.css({opacity: 0, borderRadius: $overlayParent.css('border-radius')});
        $overlay.animate({opacity: .5}, 200);

        return function(){
            $overlay.remove();

            if(static){
                $overlayParent.css('position', 'static');
            }
        };
    },
    uniFormError: function($container, errors){
        if(errors === undefined){
            $container.find('div.error').remove();
            $container.find('.error').removeClass('error');
        }
        else {
            $.each(errors, function(key,value){
                if('#' == key){
                    alert(value);
                }
                else if(typeof value == 'object'){
                    $.each(value, function(index, value){
                        var field = $container.find('[name="'+key+'['+index+']"]');
                        if(!field.length && index == 0) field = $container.find('input[type=text][name^="'+key+'"]:eq(0)');
                        Lib.uniFormShowError(field, value);
                    });
                }
                else{
                    var field = $container.find('[name="'+key+'"]'),
                        fieldHandler = $container.find('[data-error-handler="'+key+'"]');

                    if(fieldHandler.length){
                        field = fieldHandler;
                    }

                    if(field.length){
                        Lib.uniFormShowError(field, value);
                    }
                }
            });

            var $error = $container.find('div.error:eq(0)');
            if(!Lib.isElementOnView($error)) {
                Lib.scrollTo($error);
            }
        }
    },
    uniFormShowError: function($field, message){
        var visible = $field.is(':visible');

        if(!visible){
            $field.show();
        }

        var $error = $('<div class="error">'+message+'</div>'),
            reflect = {
                radius: $field.css('border-radius'),
                family: $field.css('font-family'),
                size: parseFloat($field.css('font-size')),
                line: $field.css('line-height'),
                width: $field.width(),
                height: $field.height(),
                border: {
                    top: parseFloat($field.css('border-top-width')) || 0,
                    right: parseFloat($field.css('border-right-width')) || 0,
                    bottom: parseFloat($field.css('border-bottom-width')) || 0,
                    left: parseFloat($field.css('border-left-width')) || 0
                },
                padding: {
                    top: parseFloat($field.css('padding-top')),
                    right: parseFloat($field.css('padding-right')),
                    bottom: parseFloat($field.css('padding-bottom')),
                    left: parseFloat($field.css('padding-left'))
                }
            };

        if(!visible){
            $field.hide();
        }

        if(visible){
            $error.css({
                borderRadius: reflect.radius,
                fontFamily: reflect.family,
                fontSize: reflect.size,
                lineHeight: reflect.line,
                width: reflect.width + reflect.padding.right + reflect.padding.left ,
                height: reflect.height + reflect.padding.top + reflect.padding.bottom ,
                paddingTop: reflect.padding.top,
                paddingRight: reflect.padding.right,
                paddingBottom: reflect.padding.bottom,
                paddingLeft: reflect.padding.left,
                marginTop: reflect.border.top,
                marginLeft: reflect.border.left
            });

            $field.addClass('error').closest('dd, dt, dl, td').prepend($error);
            $field.closest('tr').addClass('error');

        }else{

            //$error.addClass('static');
            $error.css({
                fontSize: reflect.size,
                lineHeight: reflect.line,
                paddingLeft: reflect.padding.left + reflect.border.left
            });
            $field.closest('dd, dt, dl, td').append($error);
            $field.closest('tr').addClass('error');
        }

        $error.click(function(){
            if($field.is('[data-error-handler]')){
                $field.click()
            }else{
                $field.focus();
            }
            $field.removeClass('error').closest('tr').removeClass('error');
            $error.remove();
        });

        $field.on('focus', function(){
            $field.removeClass('error').closest('tr').removeClass('error');
            $error.remove();
        });

        if($field.is('[data-error-handler]')){
            $error.addClass('error-handler');
        }

        $error.hide().fadeIn(100);
    },

    uniFormHandle: function(form, callbacks){
        form.on('submit', function(e){
            e.preventDefault();
            Lib.uniFormSubmit($(this), callbacks);
        });
    },
    uniFormSubmit: function(form, callbacks){
        var blackout;

        if(form.data('blocked')) return;

        if(callbacks.beforeData){
            var beforeData = callbacks.beforeData(form);
            if(beforeData === false) return false;
        }

        if(callbacks.overlay){
            blackout = Lib.uniFormBlackout(callbacks.overlay === true ? form : callbacks.overlay);
        }

        form.data('blocked', true);
        var ignoreDefaultLoading = form.data('ignoreDefaultLoading');
        var url = location.protocol+'//'+location.hostname+location.pathname;
        if (!form.data('params')){
            form.data('params', {url: url});
        }
        else {
            var params = form.data('params');
            params.url = url;
            form.data('params', params);
        }
        if (callbacks.beforeSubmit) callbacks.beforeSubmit(form);
        form.ajaxSubmit({ dataType: 'json', data: form.data('params'),
            beforeSend: function(){
                Lib.uniFormError(form);
            },
            complete: function(){


                if(callbacks.overlay){
                    blackout();
                }
            },
            success: function(data){
                form.data('blocked', false);
                if(data.error){
                    Lib.uniFormError(form, data.error);

                    if(callbacks.afterData)  callbacks.afterData(form, data);

                }else if(data.success){
                    if(callbacks.afterData)  callbacks.afterData(form, data);
                    if(callbacks.afterSuccess)  callbacks.afterSuccess(data, form);
                }else{
                    if(callbacks.afterData)  callbacks.afterData(form, data);
                }


            }
        });
        return false;
    },
    createModalBox: function(cssClass, options){
        return $('<div class="modal-box '+ ( typeof cssClass !== 'object' ? cssClass : '' ) +' '+ ( (options && options.boxCssClass) ? options.boxCssClass : '' ) +'">' +
        '<i class="arcticmodal-close modal-box-close"></i>' +
        '<div class="modal-box-content"></div>' +
        '');
    },
    openModal: function(className, options){
        options = options || {};
        if (typeof className === 'object' && className.jquery){
	        return $$.createModalBox(className, options)
                .find('.modal-box-content')
                    .html(options.title ? '<div class="modal-box-title">'+options.title+'</div>' : '')
                    .append(className.clone(true))
                .end()
                .arcticmodal(options);
        }
        else {
            return $$.createModalBox(className)
                .find('.modal-box-content')
                    .html((options.title ? '<div class="modal-box-title">'+options.title+'</div>' : '') + $('.'+className).html())
                    .end()
                    .arcticmodal(options);
        }
    },
    scrollTo: function(elem, speed, offset, callback){
        if(!elem.length) return false;
        var selector = 'html:not(:animated), body:not(:animated)';
        var blocked = false;
        var $modal = elem.closest('.arcticmodal-container');
        if($modal.length){
            selector = $modal.filter(':not(:animated)');
        }

        if(!speed) speed = 300;
        if(!offset) offset = 0;
        var offs = {};
        if(elem-0 >= 0){
            offs.top = elem;
        }else{
            offs = elem.offset();
        }

        offset = offs.top - offset;
        // offset = typeof selector == 'string' ? (offset-50) : (offset - $(document).scrollTop()+$(selector).scrollTop() - 30);

        if(offs){
            $(selector).animate({ scrollTop: offset}, speed, function(){
                if(callback && !blocked){
                    blocked = true;
                    callback();
                }
            });
            $(window).one('scroll', function(){
                $(selector).stop();
                if(callback && !blocked){
                    blocked = true;
                    callback();
                }
            });
        }

        blocked = false;
    },
	isElementOnView: function (elem, offset){
		if(!elem.length) return false;
		if(!offset) offset = 0;
		var docViewTop = $(window).scrollTop();
		var docViewBottom = docViewTop + $(window).height();

		var elemTop = $(elem).offset().top;
		var elemBottom = elemTop + $(elem).height();

		return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop+offset));
	},
	initPrettyPhoto: function(context){
		$("a[rel^='prettyPhoto'], a[rel^='image'], a[rel^='media']", context).prettyPhoto({
			animation_speed: 'fast', /* fast/slow/normal */
			opacity: 0.60, /* Value between 0 and 1 */
			show_title: false, /* true/false */
			allow_resize: true, /* Resize the photos bigger than viewport. true/false */
			default_width: 800,
			default_height: 600,
			counter_separator_label: ' |В· ', /* The separator for the gallery counter 1 "of" 2 */
			theme: 'overbyte', /* light_rounded / dark_rounded / light_square / dark_square / facebook */
			horizontal_padding: 20, /* The padding on each side of the picture */
			hideflash: false, /* Hides all the flash object on a page, set to TRUE if flash appears over prettyPhoto */
			wmode: 'opaque', /* Set the flash wmode attribute */
			autoplay: true, /* Automatically start videos: True/False */
			modal: false, /* If set to true, only the close button will close the window */
			deeplinking: false, /* Allow prettyPhoto to update the url to enable deeplinking. */
			overlay_gallery: false, /* If set to true, a gallery will overlay the fullscreen image on mouse over */
			keyboard_shortcuts: false,
			ie6_fallback: true,
			social_tools: false
		});
	},
    confirm: function(params) {
        var message = params.message ?  params.message : arguments[0];
        var onConfirm = params.onConfirm ?  params.onConfirm : arguments[1];
        var onCancel = params.onCancel ?  params.onCancel : arguments[2];

        var $box = $$.createModalBox('modal-box-message');
        var $content = $box.find('.modal-box-content');
        $content.html('<div class="modal-box-tabled"><div class="modal-box-tabled-cell"><div class="modal-box-tabled-cell-body">'+message+'</div></div></div>');
        $('<div class="modal-box-buttons modal-box-buttons--center"><button button="middle" class="button-confirm-action">OK</button><button  button="middle white" class="button-cancel-action arcticmodal-close">Отмена</button></div></div>').insertAfter($content);
        $box.arcticmodal();
        $box.find('.button-confirm-action')[0].focus();
        if(onCancel) $box.find('.button-cancel-action').on('click', function(){ onCancel() });
        $box.find('.button-confirm-action').on('click', function(){
            $box.arcticmodal('close');
            if(onConfirm) onConfirm();
        });
    },
    alert: function (text, wide, params) {

        function _alert(message, params){
            var $box = $$.createModalBox('modal-box-message '+(wide ? 'modal-box-message-wide' : ''));
            var $content = $box.find('.modal-box-content');
            $content.html('<div class="modal-box-tabled"><div class="modal-box-tabled-cell"><div class="modal-box-tabled-cell-body">'+message+'</div></div></div>');
            $('<div class="modal-box-buttons modal-box-buttons--center"><button button="middle" class="arcticmodal-close">OK</button></div>').insertAfter($content);
            $box.arcticmodal();
            $box.find('button')[0].focus();
            var onOk = params && params.onOk ?  params.onOk : arguments[2];
            $box.find('button').on('click', function(){
                if(onOk) onOk();
            });
        };

        _alert(text, wide, params);
    },
    blockOverlay: function ($elem, css) {
        var overlay = $elem.data('block-overlay');
        var css = $.extend({
            zIndex: 100,
            opacity: .5,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#fff'
        }, css);

        if ( overlay ) {
            $elem.removeData('block-overlay');
            overlay.remove();
        }
        else {
            overlay = $('<div class="block-overlay" />').css(css);

            if ( $elem.css('position') == 'static' ) {
                $elem.css({
                    position: 'relative'
                });
            }

            $elem.data('block-overlay', overlay.appendTo($elem));
        }
    }
};

(function(){
    Lib.Tabs = function (options) {
        this.defaults = {
            tabs: '[js-tabs-tab]',
            panes: '[js-tabs-pane]',
            speed: 300,
            hash: false,
            openFirst: true
        };
        this.$body = $('body');
        this.options = $.extend({}, this.defaults, options);
        this.$tabs = (typeof this.options.tabs === 'string') ? $(this.options.tabs) : this.options.tabs;
        this.$panes = (typeof this.options.panes === 'string') ? $(this.options.panes) : this.options.panes;
        this.groups = {};
        this.init();
    };
    var proto = Lib.Tabs.prototype;


    proto.select = function (group, id, speed) {
        var self = this,
            $panes = self.getPanes(group),
            $pane = $panes.filter('[data-tabs-pane~="'+group+':'+id+'"]'),
            $tabs = self.getTabs(group),
            $tab = $tabs.filter('[data-tabs-tab~="'+group+':'+id+'"]');

        var speed = typeof speed == 'undefined' ? self.options.speed : speed;

        if ($pane.length) {
            $tabs.removeClass('is-active');
            $tab.removeClass('is-broken').addClass('is-active');
            $panes.removeClass('is-hidden').stop().slideUp(speed, function() {
                $(this).addClass('is-hidden');
            });
            $pane.removeClass('is-hidden').stop().slideDown(speed, function() {
                self.$body.trigger({
                    type: 'tabChanged',
                    tab: $tab,
                    pane: $pane,
                    group: group,
                    id: id
                });
            });

            self.$body.trigger({
                type: 'tabChange',
                tab: $tab,
                pane: $pane,
                group: group,
                id: id
            });
        }
        else {
            $tab.addClass('is-broken');
        }
    };
    proto.getPanes = function (group) {
        return this.$panes.filter('[data-tabs-pane*="'+group+':"]');
    };
    proto.getTabs = function (group) {
        return this.$tabs.filter('[data-tabs-tab*="'+group+':"]');
    };
    proto.grouping = function () {
        var self = this;

        var $tabs = self.$tabs,
            groups = self.groups;

        $tabs.each(function (i, item){
            var $tab = $tabs.eq(i),
                attr = $tab.data('tabs-tab').split(':'),
                group = attr[0];
            if (typeof groups[group] == 'undefined') {
                groups[group] = new Array();
            }
            groups[group].push(attr[1]);
            $tab.data('js-tabs', attr);
        });

        this.groups = groups;
    };
    proto.binding = function () {
        var self = this;

        this.$tabs.off('.js-tabs').on('click.js-tabs', function (e){
            e.preventDefault();
            var $tab = $(this);
            if ($tab.hasClass('is-active')) return false;

            var attr = $(this).data('js-tabs'),
                group = attr[0],
                id = attr[1];

            self.select(group, id);
            if ( self.options.hash ) {
                location.hash = group+':'+id;
            }
        });
    };
    proto.parseHash = function () {
        return location.hash.substring(1).split(':');
    }
    proto.init = function () {
        var self = this,
            hash = self.parseHash();

        self.$panes.removeAttr('style');
        self.grouping();
        self.binding();

        if ( self.options.hash ) {
            $(window).on('hashchange', function (e) {
                hash = self.parseHash();
                if ( self.groups[hash[0]] ) {
                    self.select(hash[0], hash[1], 0);
                }
            });
        }

        $.each(self.groups, function (group, id){
            var $tabs = self.getTabs(group),
                $panes = self.getPanes(group),
                $active = $tabs.filter('.is-active');

            if ( self.options.hash && hash.length && hash[0] == group ) {
                if ( $tabs.filter('[data-tabs-tab~="'+group+':'+hash[1]+'"]').is(':visible') && $panes.filter('[data-tabs-pane~="'+group+':'+hash[1]+'"]').length) {
                    self.select(group, hash[1], 0);
                }
            }
            else if ( $active.length && $active.is(':visible') ) {
                self.select($active.data('js-tabs')[0], $active.data('js-tabs')[1], 0);
            }
            else if ( self.options.openFirst ) {
                self.select($tabs.eq(0).data('js-tabs')[0], $tabs.eq(0).data('js-tabs')[1], 0);
            }
            else {
                $tabs.removeClass('is-active');
                $panes.addClass('is-hidden').hide();
            }
        });
    };
})();

window.$$ = Lib;
})();


(function(){

var Helper = {
    createTabs: function (options) {
        return new $$.Tabs(options);
    },
    bindPopup: function (elems) {
        if ( !$.fn.arcticmodal ) return;

        var $elems = typeof elems === 'string' ? $(elems) : elems;

        $elems.off('.open-modal').on('click.open-modal', function (e){
            e.preventDefault();
            $$.openModal( $($(this).data('modal')), {
                closeOnEsc: true,
                closeOnOverlayClick: true,
                afterOpen: function (modal, $modal) {
                    $$.init.formPlugins($modal);
                }
            });
        });
    },
    bindModal: function (elems) {
        if ( !$.fn.arcticmodal ) return;

        var $elems = typeof elems === 'string' ? $(elems) : elems;

        $elems.off('.open-modal').on('click.open-modal', function (e){
            e.preventDefault();
            $$.openModal( $($(this).data('modal')), {
                closeOnEsc: false,
                closeOnOverlayClick: false,
                afterOpen: function (modal, $modal) {
                    $$.init.formPlugins($modal);
                }
            });
        });
    }
};

window.Helper = Helper;
})();


$.fn.selectus = function (options) {
    return $(this).each(function (i, select) {
        var $select = $(select);
        if ( $select.data('selectus') ) {
            $select.triggerHandler('update');
            return;
        };

        var $options = $select.children('option');
        var $outer = $('<div class="selectus"><div class="selectus-orig"></div><div class="selectus-input"><input type="text" name="selectus_input" value=""><div class="selectus-drop"></div></div></div>');
        var $input = $outer.find('input').prop('readonly', true);
        var prefix = $select.data('selectus-prefix')
        // var value_start = $options.filter('[selected]').val() || $options.eq(0).val();

        $select.replaceWith($outer);
        $select.appendTo($outer.find('.selectus-orig'));
        $input.val($options.filter(':selected').text());

        $select.off('.selectus').on({
            'change.selectus silentChange.selectus': function (e) {
                var text = $options.filter(':selected').text();
                $input.val(text == prefix || !prefix ? text : prefix +': '+ text);
            },
            'focus.selectus': function (e) {
                $outer.addClass('is-focus');
            },
            'blur.selectus': function (e) {
                $outer.removeClass('is-focus');
            },
            'update.selectus': function (e) {
                $select = $(this);
                $outer = $select.closest('.selectus');
                $input = $outer.find('input');
                $options = $select.children('option');
            },
            'destroy.selectus': function (e) {
                $outer.replaceWith($select.off('.selectus').data('selectus', false));
            },
            'select.selectus': function (e, data) {
                if ( !isNaN(data.id) ) {
                    $options.eq(data.id).prop('selected', true);
                    $select.trigger('silentChange');
                }
                else if ( data.value ) {
                    $options.filter(function (i, opt) {
                        return $options.eq(i).attr('value') == data.value;
                    }).prop('selected', true);
                    $select.trigger('silentChange');
                }
            }
        }).data('selectus', true);

    });
};

