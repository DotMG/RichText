(function ( $ ) {
 
    $.fn.richText = function( options ) {

        // set default options
        // and merge them with the parameter options
        var settings = $.extend({
            
            // text formatting
            bold: true,
            italic: true,
            underline: true,

            // text alignment
            leftAlign: true,
            centerAlign: true,
            rightAlign: true,

            // lists
            ol: true,
            ul: true,

            // title
            heading: true,

            // colors
            fontColor: true,

            // uploads
            imageUpload: true,
            fileUpload: true,

            // media
            videoEmbed: true,

            // link
            urls: true,

            // tables
            table: true,

            // code
            removeStyles: true,
            code: true,

            // colors
            colors: [],

            // dropdowns
            fileHTML: '',
            imageHTML: '',

            // dev settings
            useSingleQuotes: false

        }, options );


        /* prepare toolbar */
        var $inputElement = $(this);
        $inputElement.addClass("richText-initial");
        var $editor,
            $toolbarList = $('<ul />'),
            $toolbarElement = $('<li />'),
            $btnBold = $('<a />', {class: "richText-btn fa fa-bold", "data-command": "bold"}), // bold
            $btnItalic = $('<a />', {class: "richText-btn fa fa-italic", "data-command": "italic"}), // italic
            $btnUnderline = $('<a />', {class: "richText-btn fa fa-underline", "data-command": "underline"}), // underline
            $btnLeftAlign = $('<a />', {class: "richText-btn fa fa-align-left", "data-command": "justifyLeft"}), // left align
            $btnCenterAlign = $('<a />', {class: "richText-btn fa fa-align-center", "data-command": "justifyCenter"}), // centered
            $btnRightAlign = $('<a />', {class: "richText-btn fa fa-align-right", "data-command": "justifyRight"}), // right align
            $btnOL = $('<a />', {class: "richText-btn fa fa-list-ol", "data-command": "insertOrderedList"}), // ordered list
            $btnUL = $('<a />', {class: "richText-btn fa fa-list", "data-command": "insertUnorderedList"}), // unordered list
            $btnHeading = $('<a />', {class: "richText-btn fa fa-header"}), // title/header
            $btnFontColor = $('<a />', {class: "richText-btn fa fa-paint-brush"}), // font color
            $btnImageUpload = $('<a />', {class: "richText-btn fa fa-image"}), // image
            $btnVideoEmbed = $('<a />', {class: "richText-btn fa fa-video-camera"}), // video
            $btnFileUpload = $('<a />', {class: "richText-btn fa fa-file-text-o"}), // file
            $btnURLs = $('<a />', {class: "richText-btn fa fa-link"}), // urls/links
            $btnTable = $('<a />', {class: "richText-btn fa fa-table"}), // table
            $btnRemoveStyles = $('<a />', {class: "richText-btn fa fa-recycle", "data-command": "removeFormat"}), // clean up styles
            $btnCode = $('<a />', {class: "richText-btn fa fa-code", "data-command": "toggleCode"}); // code

        
        /* prepare toolbar dropdowns */
        var $dropdownOuter = $('<div />', {class: "richText-dropdown-outer"});
        var $dropdownClose = $('<span />', {class: "richText-dropdown-close", html: '<span class="fa fa-times"></span>'});
        var $dropdownList = $('<ul />', {class: "richText-dropdown"}), // dropdown lists
            $dropdownBox = $('<div />', {class: "richText-dropdown"}), // dropdown boxes / custom dropdowns
            $form = $('<div />', {class: "richText-form"}), // symbolic form
            $formItem = $('<div />', {class: 'richText-form-item'}), // form item
            $formLabel = $('<label />'), // form label
            $formInput = $('<input />', {type: "text"}), //form input field
            $formInputFile = $('<input />', {type: "file"}), // form file input field
            $formInputSelect = $('<select />'),
            $formButton = $('<button />', {text: "Einfügen", class: "btn"}); // button

        /* internal settings */
        var saveSelection, restoreSelection, savedSelection; // caret position/selection
        var editorID = "richText-" + Math.random().toString(36).substring(7);
        var ignoreSave = false, $resizeImage = null, history = [], historyPosition = 0;

        /* list dropdown for titles */
        var $titles = $dropdownList.clone();
        $titles.append($('<li />', {html: '<a data-command="formatBlock" data-option="h1">Title #1</a>'}));
        $titles.append($('<li />', {html: '<a data-command="formatBlock" data-option="h2">Title #2</a>'}));
        $titles.append($('<li />', {html: '<a data-command="formatBlock" data-option="h3">Title #3</a>'}));
        $titles.append($('<li />', {html: '<a data-command="formatBlock" data-option="h4">Title #4</a>'}));
        $btnHeading.append($dropdownOuter.clone().append($titles.prepend($dropdownClose.clone())));

        /* font colors */
        var $fontColors = $dropdownList.clone();
        $fontColors.html(loadColors("forecolor"));
        $btnFontColor.append($dropdownOuter.clone().append($fontColors.prepend($dropdownClose.clone())));


        /* background colors */
        //var $bgColors = $dropdownList.clone();
        //$bgColors.html(loadColors("hiliteColor"));
        //$btnBGColor.append($dropdownOuter.clone().append($bgColors));

        /* box dropdown for links */
        var $linksDropdown = $dropdownBox.clone();
        var $linksForm = $form.clone().attr("id", "richText-URL").attr("data-editor", editorID);
        $linksForm.append(
            $formItem.clone()
                .append($formLabel.clone().text("URL").attr("for", "url"))
                .append($formInput.clone().attr("id", "url"))
               );
        $linksForm.append(
            $formItem.clone()
                .append($formLabel.clone().text("Text").attr("for", "urlText"))
                .append($formInput.clone().attr("id", "urlText"))
               );
        $linksForm.append(
            $formItem.clone()
                .append($formLabel.clone().text("Open in").attr("for", "openIn"))
                .append(
                    $formInputSelect
                        .clone().attr("id", "openIn")
                        .append($("<option />", {value: '_self', text: 'Same tab'}))
                        .append($("<option />", {value: '_blank', text: 'New tab'}))
                    )
               );
        $linksForm.append( $formItem.clone().append($formButton.clone()) );
        $linksDropdown.append($linksForm);
        $btnURLs.append($dropdownOuter.clone().append($linksDropdown.prepend($dropdownClose.clone())));

        /* box dropdown for video embedding */
        var $videoDropdown = $dropdownBox.clone();
        var $videoForm = $form.clone().attr("id", "richText-Video").attr("data-editor", editorID);
        $videoForm.append(
            $formItem.clone()
                .append($formLabel.clone().text("URL").attr("for", "videoURL"))
                .append($formInput.clone().attr("id", "videoURL"))
            );
        $videoForm.append(
            $formItem.clone()
                .append($formLabel.clone().text("Size").attr("for", "size"))
                .append(
                        $formInputSelect
                            .clone().attr("id", "size")
                            .append($("<option />", {value: 'responsive', text: 'Responsive'}))
                            .append($("<option />", {value: '640x360', text: '640x360'}))
                            .append($("<option />", {value: '560x315', text: '560x315'}))
                            .append($("<option />", {value: '480x270', text: '480x270'}))
                            .append($("<option />", {value: '320x180', text: '320x180'}))
                        )
                   );
        $videoForm.append( $formItem.clone().append($formButton.clone()) );
        $videoDropdown.append($videoForm);
        $btnVideoEmbed.append($dropdownOuter.clone().append($videoDropdown.prepend($dropdownClose.clone())));

        /* box dropdown for image upload/image selection */
        var $imageDropdown = $dropdownBox.clone();
        var $imageForm = $form.clone().attr("id", "richText-Image").attr("data-editor", editorID);

        if(settings.imageHTML 
            && ($(settings.imageHTML).find('#imageURL').length > 0 || $(settings.imageHTML).attr("id") === "imageURL")) {
            // custom image form
            $imageForm.html(settings.imageHTML);
        } else {
            // default image form
            $imageForm.append(
                $formItem.clone()
                    .append($formLabel.clone().text("Image URL").attr("for", "imageURL"))
                    .append($formInput.clone().attr("id", "imageURL"))
                   );
            $imageForm.append(
                $formItem.clone()
                    .append($formLabel.clone().text("Align").attr("for", "align"))
                    .append(
                        $formInputSelect
                            .clone().attr("id", "align")
                            .append($("<option />", {value: 'left', text: 'Left'}))
                            .append($("<option />", {value: 'center', text: 'Center'}))
                            .append($("<option />", {value: 'right', text: 'Right'}))
                        )
                   );
        }
        $imageForm.append( $formItem.clone().append($formButton.clone()) );
        $imageDropdown.append($imageForm);
        $btnImageUpload.append($dropdownOuter.clone().append($imageDropdown.prepend($dropdownClose.clone())));

        /* box dropdown for file upload/file selection */
        var $fileDropdown = $dropdownBox.clone();
        var $fileForm = $form.clone().attr("id", "richText-File").attr("data-editor", editorID);

        if(settings.fileHTML 
            && ($(settings.fileHTML).find('#fileURL').length > 0 || $(settings.fileHTML).attr("id") === "fileURL")) {
            // custom file form
            $fileForm.html(settings.fileHTML);
        } else {
            // default file form
            $fileForm.append(
                $formItem.clone()
                    .append($formLabel.clone().text("File URL").attr("for", "fileURL"))
                    .append($formInput.clone().attr("id", "fileURL"))
                );
            $fileForm.append(
                $formItem.clone()
                    .append($formLabel.clone().text("Link text").attr("for", "fileText"))
                    .append($formInput.clone().attr("id", "fileText"))
                );
        }
        $fileForm.append( $formItem.clone().append($formButton.clone()) );
        $fileDropdown.append($fileForm);
        $btnFileUpload.append($dropdownOuter.clone().append($fileDropdown.prepend($dropdownClose.clone())));

        /* box dropdown for tables */
        var $tableDropdown = $dropdownBox.clone();
        var $tableForm = $form.clone().attr("id", "richText-Table").attr("data-editor", editorID);
        $tableForm.append(
            $formItem.clone()
                .append($formLabel.clone().text("Rows").attr("for", "tableRows"))
                .append($formInput.clone().attr("id", "tableRows").attr("type", "number"))
            );
        $tableForm.append(
            $formItem.clone()
                .append($formLabel.clone().text("Columns").attr("for", "tableColumns"))
                .append($formInput.clone().attr("id", "tableColumns").attr("type", "number"))
            );
        $tableForm.append( $formItem.clone().append($formButton.clone()) );
        $tableDropdown.append($tableForm);
        $btnTable.append($dropdownOuter.clone().append($tableDropdown.prepend($dropdownClose.clone())));


        /* initizalize editor */
        var init = function() {
            var value, attributes, attributes_html = '';
            // reformat $inputElement to textarea
            if($inputElement.prop("tagName") === "TEXTAREA") {
                // everything perfect
            } else if($inputElement.val()) {
                value = $inputElement.val();
                attributes = $inputElement.prop("attributes");
                // loop through <select> attributes and apply them on <div>
                $.each(attributes, function() {
                    if(this.name) {
                        attributes_html += ' ' + this.name + '="' + this.value + '"';
                    }
                });
                $inputElement.replaceWith($('<textarea' + attributes_html + ' data-richtext="init">' + value + '</textarea>'));
                $inputElement = $('[data-richtext="init"]');
                $inputElement.removeAttr("data-richtext");
            } else if($inputElement.html()) {
                value = $inputElement.html();
                attributes = $inputElement.prop("attributes");
                // loop through <select> attributes and apply them on <div>
                $.each(attributes, function() {
                    if(this.name) {
                        attributes_html += ' ' + this.name + '="' + this.value + '"';
                    }
                });
                $inputElement.replaceWith($('<textarea' + attributes_html + ' data-richtext="init">' + value + '</textarea>'));
                $inputElement = $('[data-richtext="init"]');
                $inputElement.removeAttr("data-richtext");
            } else {
                attributes = $inputElement.prop("attributes");
                // loop through <select> attributes and apply them on <div>
                $.each(attributes, function() {
                    if(this.name) {
                        attributes_html += ' ' + this.name + '="' + this.value + '"';
                    }
                });
                $inputElement.replaceWith($('<textarea' + attributes_html + ' data-richtext="init"></textarea>'));
                $inputElement = $('[data-richtext="init"]');
                $inputElement.removeAttr("data-richtext");
            }

            $editor = $('<div />', {class: "richText"});
            var $toolbar = $('<div />', {class: "richText-toolbar"});
            var $editorView = $('<div />', {class: "richText-editor", id: editorID, contenteditable: true});
            $toolbar.append($toolbarList);

            /* text formatting */
            if(settings.bold === true) {
                $toolbarList.append($toolbarElement.clone().append($btnBold));
            }
            if(settings.italic === true) {
                $toolbarList.append($toolbarElement.clone().append($btnItalic));
            }
            if(settings.underline === true) {
                $toolbarList.append($toolbarElement.clone().append($btnUnderline));
            }

            /* align */
            if(settings.leftAlign === true) {
                $toolbarList.append($toolbarElement.clone().append($btnLeftAlign));
            }
            if(settings.centerAlign === true) {
                $toolbarList.append($toolbarElement.clone().append($btnCenterAlign));
            }
            if(settings.rightAlign === true) {
                $toolbarList.append($toolbarElement.clone().append($btnRightAlign));
            }

            /* lists */
            if(settings.ol === true) {
                $toolbarList.append($toolbarElement.clone().append($btnOL));
            }
            if(settings.ul === true) {
                $toolbarList.append($toolbarElement.clone().append($btnUL));
            }

            /* heading */
            if(settings.heading === true) {
                $toolbarList.append($toolbarElement.clone().append($btnHeading));
            }

            /* colors */
            if(settings.fontColor === true) {
                $toolbarList.append($toolbarElement.clone().append($btnFontColor));
            }

            /* uploads */
            if(settings.imageUpload === true) {
                $toolbarList.append($toolbarElement.clone().append($btnImageUpload));
            }
            if(settings.fileUpload === true) {
                $toolbarList.append($toolbarElement.clone().append($btnFileUpload));
            }

            /* media */
            if(settings.videoEmbed === true) {
                $toolbarList.append($toolbarElement.clone().append($btnVideoEmbed));
            }

            /* urls */
            if(settings.urls === true) {
                $toolbarList.append($toolbarElement.clone().append($btnURLs));
            }

            if(settings.table === true) {
                $toolbarList.append($toolbarElement.clone().append($btnTable));
            }

            /* code */
            if(settings.removeStyles === true) {
                $toolbarList.append($toolbarElement.clone().append($btnRemoveStyles));
            }
            if(settings.code === true) {
                $toolbarList.append($toolbarElement.clone().append($btnCode));
            }

            // set current textarea value to editor
            $editorView.html($inputElement.val());

            $editor.append($toolbar);
            $editor.append($editorView);
            $editor.append($inputElement.clone().hide());
            $inputElement.replaceWith($editor);

            // append bottom toolbar
            $editor.append(
                $('<div />', {class: 'richText-toolbar'})
                    .append($('<a />', {class: 'richText-undo is-disabled', html: '<span class="fa fa-undo"></span>'}))
                    .append($('<a />', {class: 'richText-redo is-disabled', html: '<span class="fa fa-repeat"></span>'}))
                    .append($('<a />', {class: 'richText-help', html: '<span class="fa fa-question-circle"></span>'}))
            );

            // save history
            history.push($editor.find("textarea").val());
        };

        init();


        /** EVENT HANDLERS */

        // Help popup
        $(document).on("click", ".richText-help", function() {

            var $editor = $(this).parents(".richText");
            if($editor) {
                var $outer = $('<div />', {class: 'richText-help-popup', style: 'position:absolute;top:0;right:0;bottom:0;left:0;background-color: rgba(0,0,0,0.3);'});
                var $inner = $('<div />', {style: 'position:relative;margin:60px auto;padding:20px;background-color:#FAFAFA;width:70%;font-family:Calibri,Verdana,Helvetica,sans-serif;font-size:small;'});
                var $content = $('<div />', {html: '<span id="closeHelp" style="display:block;position:absolute;top:0;right:0;padding:10px;cursor:pointer;" class="fa fa-times" title="Close"></span>'});
                $content.append('<b>RichText</b>');
                $content.append('<hr>Powered by <a href="https://github.com/webfashionist/RichText" target="_blank">webfashionist/RichText</a> (Github) <br>License: <a href="https://github.com/webfashionist/RichText/blob/master/LICENSE" target="_blank">AGPL-3.0</a>');

                $outer.append($inner.append($content));
                $editor.append($outer);

                $('#closeHelp').on("click", function() {
                    $('.richText-help-popup').remove();
                });
            }

        });

        // undo / redo
        $(document).on("click", ".richText-undo, .richText-redo", function(e) {
             var $this = $(this);
             if($this.hasClass("richText-undo") && !$this.hasClass("is-disabled")) {
                 undo();
             } else if($this.hasClass("richText-redo") && !$this.hasClass("is-disabled")) {
                 redo();
             }
        });


        // Saving changes from editor to textarea
        $(document).on("input change blur keydown", ".richText-editor", function(e) {
            if((e.keyCode === 9 || e.keyCode === "9") && e.type === "keydown") {
                // tab through table cells
                e.preventDefault();
                tabifyEditableTable(window, e);
                return false;
            }
            updateTextarea();
            doSave();
        });

        // Saving changes from textarea to editor
        $(document).on("input change blur", ".richText-initial", function() {
            if(settings.useSingleQuotes === true) {
                $(this).val(changeAttributeQuotes($(this).val()));
            }
            updateEditor();
            doSave();
        });

        // Save selection seperately (mainly needed for Safari)
        $(document).on("dblclick mouseup", ".richText-editor", function() {
            doSave();
        });

        // embedding video
        $(document).on("click", "#richText-Video button.btn", function(event) {
            event.preventDefault();
            var $button = $(this);
            var $form = $button.parent('.richText-form-item').parent('.richText-form');
            if($form.attr("data-editor") === editorID) {
                // only for the currently selected editor
                var url = $form.find('input#videoURL').val();
                var size = $form.find('select#size').val();

                if(!url) {
                    // no url set
                    $form.prepend($('<div />', {style: 'color:red;display:none;', class: 'form-item is-error', text: 'Please enter an URL'}));
                    $form.children('.form-item.is-error').slideDown();
                    setTimeout(function() {
                        $form.children('.form-item.is-error').slideUp(function () {
                            $(this).remove();
                        });
                    }, 5000);
                } else {
                    // write html in editor
                    var html = '';
                    html = getVideoCode(url, size);
                    if(!html) {
                        $form.prepend($('<div />', {style: 'color:red;display:none;', class: 'form-item is-error', text: 'Video URL not supported'}));
                        $form.children('.form-item.is-error').slideDown();
                        setTimeout(function() {
                            $form.children('.form-item.is-error').slideUp(function () {
                                $(this).remove();
                            });
                        }, 5000);
                    } else {
                        if(settings.useSingleQuotes === true) {

                        } else {

                        }
                        restoreSelection();
                        pasteHTMLAtCaret(html);
                        updateTextarea();
                        // reset input values
                        $form.find('input#videoURL').val('');
                        $('.richText-toolbar li.is-selected').removeClass("is-selected");
                    }
                }
            }
        });

        // Resize images
        $(document).on('mousedown', function(e) {
            var $target = $(e.target);
            if($target.prop("tagName") === "IMG" && $target.parents("#" + editorID)) {
                $resizeImage = $target;
                startX = e.pageX;
                startY = e.pageY;
                $resizeImage.css({'cursor' : 'nw-resize'});
                startW = $resizeImage.innerWidth();
                startH = $resizeImage.innerHeight();
                if(!$resizeImage.data("width")) {
                    $resizeImage.data("width", $target.parents("#" + editorID).innerWidth());
                    $resizeImage.data("height", $target.parents("#" + editorID).innerHeight()*3);

                }
                return false;
            }
        });
        $(document)
            .mouseup(function(){
                $resizeImage = null;
            })
            .mousemove(function(e){
                if($resizeImage!==null){
                    var maxWidth = $resizeImage.data('width');
                    var currentWidth = $resizeImage.width();
                    var maxHeight = $resizeImage.data('height');
                    var currentHeight = $resizeImage.height();
                    if((startW + e.pageX-startX) <= maxWidth && (startH + e.pageY-startY) <= maxHeight) {
                        // only resize if new size is smaller than the original image size
                        $resizeImage.innerWidth (startW + e.pageX-startX); // only resize width to adapt height proportionally
                        // $box.innerHeight(startH + e.pageY-startY);
                        updateTextarea();
                    } else if((startW + e.pageX-startX) <= currentWidth && (startH + e.pageY-startY) <= currentHeight) {
                        // only resize if new size is smaller than the previous size
                        $resizeImage.innerWidth (startW + e.pageX-startX); // only resize width to adapt height proportionally
                        updateTextarea();
                    }
                }
            });

        // adding URL
        $(document).on("click", "#richText-URL button.btn", function(event) {
            event.preventDefault();
            var $button = $(this);
            var $form = $button.parent('.richText-form-item').parent('.richText-form');
            if($form.attr("data-editor") === editorID) {
                // only for currently selected editor
                var url = $form.find('input#url').val();
                var text = $form.find('input#urlText').val();
                var target = $form.find('#openIn').val();

                // set default values
                if(!target) {
                    target = '_self';
                }
                if(!text) {
                    text = url;
                }
                if(!url) {
                    // no url set
                    $form.prepend($('<div />', {style: 'color:red;display:none;', class: 'form-item is-error', text: 'Please enter an URL'}));
                    $form.children('.form-item.is-error').slideDown();
                    setTimeout(function() {
                        $form.children('.form-item.is-error').slideUp(function () {
                            $(this).remove();
                        });
                    }, 5000);
                } else {
                    // write html in editor
                    var html = '';
                    if(settings.useSingleQuotes === true) {
                        html = "<a href='" + url + "' target='" + target + "'>" + text + "</a>";
                    } else {
                        html = '<a href="' + url + '" target="' + target + '">' + text + '</a>';
                    }
                    restoreSelection();
                    pasteHTMLAtCaret(html);
                    // reset input values
                    $form.find('input#url').val('');
                    $form.find('input#urlText').val('');
                    $('.richText-toolbar li.is-selected').removeClass("is-selected");
                }
            }
        });

        // adding image
        $(document).on("click", "#richText-Image button.btn", function(event) {
            event.preventDefault();
            var $button = $(this);
            var $form = $button.parent('.richText-form-item').parent('.richText-form');
            if($form.attr("data-editor") === editorID) {
                // only for currently selected editor
                var url = $form.find('#imageURL').val();
                var align = $form.find('select#align').val();

                // set default values
                if(!align) {
                    align = 'center';
                }
                if(!url) {
                    // no url set
                    $form.prepend($('<div />', {style: 'color:red;display:none;', class: 'form-item is-error', text: 'Please select an image.'}));
                    $form.children('.form-item.is-error').slideDown();
                    setTimeout(function() {
                        $form.children('.form-item.is-error').slideUp(function () {
                            $(this).remove();
                        });
                    }, 5000);
                } else {
                    // write html in editor
                    var html = '';
                    if(settings.useSingleQuotes === true) {
                        if(align === "center") {
                            html = "<div style='text-align:center;'><img src='" + url + "'></div>";
                        } else {
                            html = "<img src='" + url + "' align='" + align + "'>";
                        }
                    } else {
                        if(align === "center") {
                            html = '<div style="text-align:center;"><img src="' + url + '"></div>';
                        } else {
                            html = '<img src="' + url + '" align="' + align + '">';
                        }
                    }
                    restoreSelection();
                    pasteHTMLAtCaret(html);
                    // reset input values
                    $form.find('input#imageURL').val('');
                    $('.richText-toolbar li.is-selected').removeClass("is-selected");
                }
            }
        });

        // adding file
        $(document).on("click", "#richText-File button.btn", function(event) {
            event.preventDefault();
            var $button = $(this);
            var $form = $button.parent('.richText-form-item').parent('.richText-form');
            if($form.attr("data-editor") === editorID) {
                // only for currently selected editor
                var url = $form.find('#fileURL').val();
                var text = $form.find('#fileText').val();

                // set default values
                if(!text) {
                    text = url;
                }
                if(!url) {
                    // no url set
                    $form.prepend($('<div />', {style: 'color:red;display:none;', class: 'form-item is-error', text: 'Please select a file.'}));
                    $form.children('.form-item.is-error').slideDown();
                    setTimeout(function() {
                        $form.children('.form-item.is-error').slideUp(function () {
                            $(this).remove();
                        });
                    }, 5000);
                } else {
                    // write html in editor
                    var html = '';
                    if(settings.useSingleQuotes === true) {
                        html = "<a href='" + url + "' target='_blank'>" + text + "</a>";
                    } else {
                        html = '<a href="' + url + '" target="_blank">' + text + '</a>';
                    }
                    restoreSelection();
                    pasteHTMLAtCaret(html);
                    // reset input values
                    $form.find('input#fileURL').val('');
                    $form.find('input#fileText').val('');
                    $('.richText-toolbar li.is-selected').removeClass("is-selected");
                }
            }
        });


        // adding table
        $(document).on("click", "#richText-Table button.btn", function(event) {
            event.preventDefault();
            var $button = $(this);
            var $form = $button.parent('.richText-form-item').parent('.richText-form');
            if($form.attr("data-editor") === editorID) {
                // only for currently selected editor
                var rows = $form.find('input#tableRows').val();
                var columns = $form.find('input#tableColumns').val();

                // set default values
                if(!rows || rows <= 0) {
                    rows = 2;
                }
                if(!columns || columns <= 0) {
                    columns = 2;
                }
                
                // generate table
                var html = '';
                if(settings.useSingleQuotes === true) {
                    html = "<table class='table-1'><tbody>";
                } else {
                    html = '<table class="table-1"><tbody>';
                }
                for(var i = 1; i <= rows; i++) {
                    // start new row
                    html += '<tr>';
                    for(var n = 1; n <= columns; n++) {
                        // start new column in row
                        html += '<td> </td>';
                    }
                    html += '</tr>';
                }
                html += '</tbod></table>';

                // write html in editor
                restoreSelection();
                pasteHTMLAtCaret(html);
                // reset input values
                $form.find('input#tableColumns').val('');
                $form.find('input#tableRows').val('');
                $('.richText-toolbar li.is-selected').removeClass("is-selected");
            }
        });

        // opening / closing toolbar dropdown
        $(document).on("click", function(event) {
            var $clickedElement = $(event.target);

            if($clickedElement.parents('.richText-toolbar').length === 0) {
                // element not in toolbar
                // ignore
            } else if($clickedElement.hasClass("richText-dropdown-outer")) {
                // closing dropdown by clicking inside the editor
                $clickedElement.parent('a').parent('li').removeClass("is-selected");
            } else if($clickedElement.find(".richText").length > 0) {
                // closing dropdown by clicking outside of the editor
                $('.richText-toolbar li').removeClass("is-selected");
            } else if($clickedElement.parent().hasClass("richText-dropdown-close")) {
                // closing dropdown by clicking on the close button
                $('.richText-toolbar li').removeClass("is-selected");
            } else if($clickedElement.hasClass("richText-btn") && $(event.target).children('.richText-dropdown-outer').length > 0) {
                // opening dropdown by clicking on toolbar button
                $clickedElement.parent('li').addClass("is-selected");

                if($clickedElement.hasClass("fa-link")) {
                    // put currently selected text in URL form to replace it
                    restoreSelection();
                    var selectedText = getSelectedText();
                    $clickedElement.find("input#urlText").val('');
                    $clickedElement.find("input#url").val('');
                    if(selectedText) {
                        $clickedElement.find("input#urlText").val(selectedText);
                    }
                } else if($clickedElement.hasClass("fa-image")) {
                    // image
                }
            }
        });

        // Executing editor commands
        $(document).on("click", ".richText-toolbar a[data-command]", function(event) {
            var $button = $(this);
            var $toolbar = $button.closest('.richText-toolbar');
            if($toolbar.siblings("#" + editorID).length > 0 && (!$button.parent("li").attr('data-disable') || $button.parent("li").attr('data-disable') === "false")) {
                event.preventDefault();
                var command = $(this).data("command");

                if(command === "toggleCode") {
                    toggleCode();
                } else {
                    var option = null;
                    if ($(this).data('option')) {
                        option = $(this).data('option');
                        if (option.match(/^h[1-6]$/)) {
                            command = "heading";
                        }
                    }
                    formatText(command, option);
                    if (command === "removeFormat") {
                        formatText('formatBlock', 'div');
                    }
                }
            }
        });



        /** INTERNAL METHODS **/

        /**
         * Format text in editor
         * @param {string} command
         * @param {string|null} option
         * @private
         */
        function formatText(command, option) {
            if (typeof option === "undefined") {
                option = null;
            }
            // restore selection from before clicking on any button
            doRestore();
            // Temporarily enable designMode so that
            // document.execCommand() will work
            // document.designMode = "ON";
            // Execute the command
            if(command === "heading" && getSelectedText()) {
                // IE workaround
                pasteHTMLAtCaret('<' + option + '>' + getSelectedText() + '</' + option + '>');
            } else {
                document.execCommand(command, false, option);
            }
            // Disable designMode
            // document.designMode = "OFF";
        }


        /**
         * Update textarea when updating editor
         * @private
         */
        function updateTextarea() {
            var $editor = $('#' + editorID);
            var content = $editor.html();
            if(settings.useSingleQuotes === true) {
                content = changeAttributeQuotes(content);
            }
            $editor.siblings('.richText-initial').val(content);
        }


        /**
         * Update editor when updating textarea
         * @private
         */
        function updateEditor() {
            var $editor = $('#' + editorID);
            var content = $editor.siblings('.richText-initial').val();
            $editor.html(content);
        }

        /** save caret position **/
        if (window.getSelection && document.createRange) {
            saveSelection = function() {
                var containerEl = document.getElementById(editorID);
                var sel = window.getSelection && window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    var range = window.getSelection().getRangeAt(0);
                    var preSelectionRange = range.cloneRange();
                    preSelectionRange.selectNodeContents(containerEl);
                    preSelectionRange.setEnd(range.startContainer, range.startOffset);
                    var start = preSelectionRange.toString().length;

                    return {
                        start: start,
                        end: start + range.toString().length
                    }
                } else {
                    return (savedSelection ? savedSelection : {
                        start: 0,
                        end: 0
                    });
                }
            };
            restoreSelection = function() {
                var containerEl = document.getElementById(editorID);
                var savedSel = savedSelection;
                var charIndex = 0, range = document.createRange();
                range.setStart(containerEl, 0);
                range.collapse(true);
                var nodeStack = [containerEl], node, foundStart = false, stop = false;

                while (!stop && (node = nodeStack.pop())) {
                    if (node.nodeType === 3) {
                        var nextCharIndex = charIndex + node.length;
                        if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                            range.setStart(node, savedSel.start - charIndex);
                            foundStart = true;
                        }
                        if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                            range.setEnd(node, savedSel.end - charIndex);
                            stop = true;
                        }
                        charIndex = nextCharIndex;
                    } else {
                        var i = node.childNodes.length;
                        while (i--) {
                            nodeStack.push(node.childNodes[i]);
                        }
                    }
                }

                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            };
        } else if (document.selection && document.body.createTextRange) {
            saveSelection = function() {
                var containerEl = document.getElementById(editorID);
                var selectedTextRange = document.selection.createRange();
                var preSelectionTextRange = document.body.createTextRange();
                preSelectionTextRange.moveToElementText(containerEl);
                preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
                var start = preSelectionTextRange.text.length;

                return {
                    start: start,
                    end: start + selectedTextRange.text.length
                };
            };
            restoreSelection = function() {
                var containerEl = document.getElementById(editorID);
                var savedSel = savedSelection;
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(containerEl);
                textRange.collapse(true);
                textRange.moveEnd("character", savedSel.end);
                textRange.moveStart("character", savedSel.start);
                textRange.select();
            };
        }


        /**
         * Enables tabbing/shift-tabbing between contentEditable table cells
         * @param {Window} win - Active window context.
         * @param {Event} e - jQuery Event object for the keydown that fired.
         */
        function tabifyEditableTable(win, e) {

            if (e.keyCode !== 9) {
                return false;
            }

            var sel;

            if (win.getSelection) {

            sel = win.getSelection();
                if (sel.rangeCount > 0) {

                    var textNode = null;

                    if (!e.shiftKey) {
                        textNode = (sel.focusNode.nodeName === "TD") 
                            ? (sel.focusNode.nextSibling != null) 
                                ? sel.focusNode.nextSibling 
                                : (sel.focusNode.parentNode.nextSibling != null) 
                                    ? sel.focusNode.parentNode.nextSibling.childNodes[0] 
                                    : null 
                                : (sel.focusNode.parentNode.nextSibling != null) 
                                ? sel.focusNode.parentNode.nextSibling 
                                : (sel.focusNode.parentNode.parentNode.nextSibling != null) 
                            ? sel.focusNode.parentNode.parentNode.nextSibling.childNodes[0] 
                            : null;
                    } else {
                        textNode = (sel.focusNode.nodeName === "TD") 
                            ? (sel.focusNode.previousSibling != null) 
                                ? sel.focusNode.previousSibling 
                                : (sel.focusNode.parentNode.previousSibling != null) 
                                    ? sel.focusNode.parentNode.previousSibling.childNodes[sel.focusNode.parentNode.previousSibling.childNodes.length - 1] 
                                    : null 
                                : (sel.focusNode.parentNode.previousSibling != null) 
                            ? sel.focusNode.parentNode.previousSibling 
                            : (sel.focusNode.parentNode.parentNode.previousSibling != null) 
                        ? sel.focusNode.parentNode.parentNode.previousSibling.childNodes[sel.focusNode.parentNode.parentNode.previousSibling.childNodes.length - 1] 
                        : null;
                    }

                    if (textNode != null) {
                        sel.collapse(textNode, Math.min(textNode.length, sel.focusOffset + 1));
                        if (textNode.textContent != null) {
                            sel.selectAllChildren(textNode);
                        }
                        e.preventDefault();
                        return true;
                    }
                }
            }
            return false;
        }

        /**
         * Returns the text from the current selection
         * @private
         * @return {string|boolean}
         */
        function getSelectedText() {
            var range;
            if (window.getSelection) {  // all browsers, except IE before version 9
                range = window.getSelection ();
                return range.toString();
            } else  if (document.selection.createRange) { // Internet Explorer
                range = document.selection.createRange ();
                return range.text;
            }
            return false;
        }

        /**
         * Save selection
         */
        function doSave() {
            addHistory($editor.find("textarea").val());
            savedSelection = saveSelection();
        }

        /**
         * Add to history
         * @param val
         */
        function addHistory(val) {
            if(history.length-1 > historyPosition) {
                history.length  = historyPosition + 1;
            }

            if(history[history.length-1] !== val) {
                history.push(val);
            }

            historyPosition = history.length-1;
            setHistoryButtons();
        }

        function setHistoryButtons() {
            if(historyPosition <= 0) {
                $editor.find(".richText-undo").addClass("is-disabled");
            } else {
                $editor.find(".richText-undo").removeClass("is-disabled");
            }

            if(historyPosition >= history.length-1 || history.length === 0) {
                $editor.find(".richText-redo").addClass("is-disabled");
            } else {
                $editor.find(".richText-redo").removeClass("is-disabled");
            }
        }

        /**
         * Undo
         */
        function undo() {
            historyPosition--;
            var value = history[historyPosition];
            $editor.find('textarea').val(value);
            $editor.find('.richText-editor').html(value);
            setHistoryButtons();
        }

        /**
         * Undo
         */
        function redo() {
            historyPosition++;
            var value = history[historyPosition];
            $editor.find('textarea').val(value);
            $editor.find('.richText-editor').html(value);
            setHistoryButtons();
        }

        /**
         * Restore selection
         */
        function doRestore() {
            if(savedSelection) {
                restoreSelection();
            }
        }

        /**
         * Paste HTML at caret position
         * @param {string} html HTML code
         * @private
         */
        function pasteHTMLAtCaret(html) {
            // add HTML code for Internet Explorer
            var sel, range;
            if (window.getSelection) {
                // IE9 and non-IE
                sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();

                    // Range.createContextualFragment() would be useful here but is
                    // only relatively recently standardized and is not supported in
                    // some browsers (IE9, for one)
                    var el = document.createElement("div");
                    el.innerHTML = html;
                    var frag = document.createDocumentFragment(), node, lastNode;
                    while ( (node = el.firstChild) ) {
                        lastNode = frag.appendChild(node);
                    }
                    range.insertNode(frag);

                    // Preserve the selection
                    if (lastNode) {
                        range = range.cloneRange();
                        range.setStartAfter(lastNode);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
            } else if (document.selection && document.selection.type !== "Control") {
                // IE < 9
                document.selection.createRange().pasteHTML(html);
            }
        }


        /**
         * Change quotes around HTML attributes
         * @param  {string} string
         * @return {string}
         */
        function changeAttributeQuotes(string) {
            if(!string) {
                return '';
            }

            var regex;
            var rstring;
            if(settings.useSingleQuotes === true) {
                regex = /\s+(\w+\s*=\s*(["][^"]*["])|(['][^']*[']))+/g;
                rstring = string.replace(regex, function($0,$1,$2){
                    if(!$2) {return $0;}
                    return $0.replace($2, $2.replace(/\"/g, "'"));
                });
            } else {
                regex = /\s+(\w+\s*=\s*(['][^']*['])|(["][^"]*["]))+/g;
                rstring = string.replace(regex, function($0,$1,$2){
                    if(!$2) {return $0;}
                    return $0.replace($2, $2.replace(/'/g, '"'));
                });
            }
            return rstring;
        }


        /**
         * Load colors for font or background
         * @param {string} command Command
         * @returns {string}
         * @private
         */
        function loadColors(command) {
            var colors = [];
            var result = '';

            colors["#FFFFFF"] = 'White';
            colors["#000000"] = 'Black';
            colors["#7F6000"] = 'Brown';
            colors["#938953"] = 'Beige';
            colors["#1F497D"] = 'Dark Blue';
            colors["blue"] = 'Blue';
            colors["#4F81BD"] = 'Light blue';
            colors["#953734"] = 'Dark red';
            colors["red"] = 'Red';
            colors["#4F6128"] = 'Dark green';
            colors["green"] = 'Green';
            colors["#3F3151"] = 'Purple';
            colors["#31859B"] = 'Dark Turquois';
            colors["#4BACC6"] = 'Turquois';
            colors["#E36C09"] = 'Dark orange';
            colors["#F79646"] = 'Orange';
            colors["#FFFF00"] = 'Yellow';

            if(settings.colors && settings.colors.length > 0) {
                colors = settings.colors;
            }

            for (var i in colors) {
                result += '<li class="inline"><a data-command="' + command + '" data-option="' + i + '" style="text-align:left;" title="' + colors[i] + '"><span class="box-color" style="background-color:' + i + '"></span></a></li>';
            }
            return result;
        }


        /**
         * Toggle (show/hide) code or editor
         * @private
         */
        function toggleCode() {

            if($editor.find('.richText-editor').is(":visible")) {
                // show code
                $editor.find('.richText-initial').show();
                $editor.find('.richText-editor').hide(); 
                // disable non working buttons
                $('.richText-toolbar').find('.richText-btn').each(function() {
                    if(!$(this).hasClass("fa-code")) {
                        $(this).parent('li').attr("data-disable", "true");
                    }
                });
            } else {
                // show editor
                $editor.find('.richText-initial').hide();
                $editor.find('.richText-editor').show();
                // enable all buttons again
                $('.richText-toolbar').find('li').removeAttr("data-disable");
            }

        }


        /**
         * Get video embed code from URL
         * @param {string} url Video URL
         * @param {string} size Size in the form of widthxheight
         * @return {string|boolean}
         * @private
         **/
        function getVideoCode(url, size) {
            var video = getVideoID(url);
            var responsive = false, success = false;

            if(!video) {
                // video URL not supported
                return false;
            }

            if(!size) {
                size = "640x360";
                size = size.split("x");
            } else if(size !== "responsive") {
                size = size.split("x");
            } else {
                responsive = true;
                size = "640x360";
                size = size.split("x");
            }

            var html = '<br><br>';
            if(responsive === true) {
                html += '<div style="position:relative;height:0;padding-bottom:56.25%">';
            }
            var allowfullscreen = 'webkitallowfullscreen mozallowfullscreen allowfullscreen';

            if(video.platform === "YouTube") {
                html += '<iframe src="https://www.youtube.com/embed/' + video.id + '?ecver=2" width="' + size[0] + '" height="' + size[1] + '" frameborder="0"' + (responsive === true ? ' style="position:absolute;width:100%;height:100%;left:0"' : '') + ' ' + allowfullscreen + '></iframe>';
                success = true;
            } else if(video.platform === "Vimeo") {
                html += '<iframe src="https://player.vimeo.com/video/' + video.id + '" width="' + size[0] + '" height="' + size[1] + '" frameborder="0"' + (responsive === true ? ' style="position:absolute;width:100%;height:100%;left:0"' : '') + ' ' + allowfullscreen + '></iframe>';
                success = true;
            } else if(video.platform === "Facebook") {
                html += '<iframe src="https://www.facebook.com/plugins/video.php?href=' + encodeURI(url) + '&show_text=0&width=' + size[0] + '" width="' + size[0] + '" height="' + size[1] + '" style="' + (responsive === true ? 'position:absolute;width:100%;height:100%;left:0;border:none;overflow:hidden"' : 'border:none;overflow:hidden') + '" scrolling="no" frameborder="0" allowTransparency="true" ' + allowfullscreen + '></iframe>';
                success = true;
            } else if(video.platform === "Dailymotion") {
                html += '<iframe frameborder="0" width="' + size[0] + '" height="' + size[1] + '" src="//www.dailymotion.com/embed/video/' + video.id + '"' + (responsive === true ? ' style="position:absolute;width:100%;height:100%;left:0"' : '') + ' ' + allowfullscreen + '></iframe>';
                success = true;
            }

            if(responsive === true) {
                html += '</div>';
            }
            html += '<br><br>';

            if(success) {
                return html;
            }
            return false;
        }

        /**
         * Returns the unique video ID
         * @param {string} url
         * return {object|boolean}
         **/
        function getVideoID(url) {
            var vimeoRegExp = /(?:http?s?:\/\/)?(?:www\.)?(?:vimeo\.com)\/?(.+)/;
            var youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            var facebookRegExp = /(?:http?s?:\/\/)?(?:www\.)?(?:facebook\.com)\/.*\/videos\/[0-9]+/;
            var dailymotionRegExp = /(?:http?s?:\/\/)?(?:www\.)?(?:dailymotion\.com)\/video\/([a-zA-Z0-9]+)/;
            var youtubeMatch = url.match(youtubeRegExp);
            var vimeoMatch = url.match(vimeoRegExp);
            var facebookMatch = url.match(facebookRegExp);
            var dailymotionMatch = url.match(dailymotionRegExp);

            if (youtubeMatch && youtubeMatch[2].length === 11) {
                return {
                    "platform": "YouTube", 
                    "id": youtubeMatch[2]
                };
            } else if(vimeoMatch && vimeoMatch[1]) {
                return {
                    "platform": "Vimeo",
                    "id": vimeoMatch[1]
                };
            } else if(facebookMatch && facebookMatch[0]) {
                return {
                    "platform": "Facebook",
                    "id" : facebookMatch[0]
                };
            } else if(dailymotionMatch && dailymotionMatch[1]) {
                return {
                    "platform": "Dailymotion",
                    "id" : dailymotionMatch[1]
                };
            }

            return false;
        }

        return $(this);
    };
 
}( jQuery ));