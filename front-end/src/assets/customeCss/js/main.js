
 
(function ($) {
    "use strict";

    $(window).on('load', function(){
        //===== Prealoder
        $('.proloader').delay(500).fadeOut(500)
    });

    $(document).ready(function () {

        $('#image-buffer').on('load', function() {
            $('#qrcode').empty().qrcode({
              render: 'canvas',
              ecLevel: 'H',
              minVersion: 6,
              mode: 4,
              fill: '#000000',
              background: '#ffffff',
              text: location.href,
              quiet: 1,
              radius: 0.2,
              mPosX: 0.5,
              mPosY: 0.5,
              mSize: 0.20,
              size: 200,
              image: $('#image-buffer')[0]
            });
          });
          


        // Hamburger-menu
        $('.toggle_bar').on('click', function () {
            $('#menu').slideToggle();
        });

        $('.msg_btn, .close_btn').on('click', function(){
        $(this).parent().parent().toggleClass('selected');
        $('.chat_box').toggleClass('d-none');
        });



        $("#datepicker").datepicker({ 
            autoclose: true, 
            todayHighlight: true,
        }).datepicker('update', new Date());


        
        $('.map_location').on('click', function(){
            $('.slider_area').toggleClass('owl-carousel');
        });


        // upload image   
        var readURL = function(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
    
                reader.onload = function (e) {
                    $('.pic1').attr('src', e.target.result);
                }
        
                reader.readAsDataURL(input.files[0]);
            }
        }
        $(".file-upload1").on('change', function(){
            readURL(this);
        });
        
        $(".upload-button1").on('click', function() {
           $(".file-upload1").click();
        });




        var readURL2 = function(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
    
                reader.onload = function (e) {
                    $('.pic2').attr('src', e.target.result);
                }
        
                reader.readAsDataURL(input.files[0]);
            }
        }
        $(".file-upload2").on('change', function(){
            readURL2(this);
        });
        
        $(".upload-button2").on('click', function() {
           $(".file-upload2").click();
        });

        var readURL3 = function(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
    
                reader.onload = function (e) {
                    $('.pic3').attr('src', e.target.result);
                }
        
                reader.readAsDataURL(input.files[0]);
            }
        }
        $(".file-upload3").on('change', function(){
            readURL3(this);
        });
        
        $(".upload-button3").on('click', function() {
           $(".file-upload3").click();
        });

        var readURL4 = function(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
    
                reader.onload = function (e) {
                    $('.pic4').attr('src', e.target.result);
                }
        
                reader.readAsDataURL(input.files[0]);
            }
        }
        $(".file-upload4").on('change', function(){
            readURL4(this);
        });
        
        $(".upload-button4").on('click', function() {
           $(".file-upload4").click();
        });

        var readURL5 = function(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
    
                reader.onload = function (e) {
                    $('.pic5').attr('src', e.target.result);
                }
        
                reader.readAsDataURL(input.files[0]);
            }
        }
        $(".file-upload5").on('change', function(){
            readURL5(this);
        });
        
        $(".upload-button5").on('click', function() {
           $(".file-upload5").click();
        });


        $('input[type="number"]').niceNumber();
            




       
    });

})(jQuery);