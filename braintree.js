<script src="https://js.braintreegateway.com/web/dropin/1.22.1/js/dropin.js"></script>
// get braintree client token from backend
  $.ajax({
    url: '/api/brain_token',
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    },
    type: 'POST',
    dataType: 'JSON',
    data: { 'id': brain_cus_id },
    success: function (res) {
      braintree.dropin.create({
        authorization: res.token,
        container: '#dropin-container',
        locale: lang == 'en' ? 'en_US' : 'no_NO',
        vaultManager: true,
      }, function (createErr, instance) {
        if (createErr) {
          console.log('create Error', createErr);
          return;
        }
        $(".pay-cust-credit").removeClass("display-none");
        $(".credit-box").removeClass("display-none");
        button.addEventListener('click', function (event) {
          instance.requestPaymentMethod(function (err, payload) {
            if (err) {
              console.log('Request Payment Method Error', err);
              return;
            }
            var pay_info = {
              currency: currency,
              payment_method_nonce: payload.nonce,
              amount: selected_cost,
              checked: $("#save-card").not(':checked').length > 0,
              customerId: brain_cus_id,
              cardType: payload.details.cardType
            };
            $.ajax({
              url: '/api/credit_checkout',
              headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
              },
              type: 'POST',
              dataType: 'JSON',
              data: pay_info,
              success: function (res) {
                var calculated_charged_amount = 0;
                if (res.status == 'success') {
                  var endpoint = 'live';
                  var access_key = '8c479a455a6d8a2f5cccc8ce01819269';
                  if (res.transaction.currencyIsoCode == 'USD' || res.transaction.currencyIsoCode == 'EUR') {
                    $.ajax({
                      url: 'http://apilayer.net/api/' + endpoint + '?access_key=' + access_key,
                      dataType: 'jsonp',
                      success: function (json) {
                        if (res.transaction.currencyIsoCode == 'USD') {
                          calculated_charged_amount = (res.transaction.amount * json.quotes.USDNOK).toFixed(2);
                        } else if (res.transaction.currencyIsoCode == 'EUR') {
                          calculated_charged_amount = (res.transaction.amount * json.quotes.USDNOK / json.quotes.USDEUR).toFixed(2);
                        }
                        $.ajax({
                          url: '/api/balance_manage',
                          headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                          },
                          type: 'POST',
                          dataType: 'JSON',
                          data: { balance: calculated_charged_amount },
                          success: function (res) {
                            $("#pay-modal-amount").html("<b>" + calculated_charged_amount + "kr</b>" + " have been added to your balance.");
                            $("#payment-confirmation").modal('show');
                          }
                        });
                      }
                    });
                  } else {
                    calculated_charged_amount = res.transaction.amount;
                    $.ajax({
                      url: '/api/balance_manage',
                      headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                      },
                      type: 'POST',
                      dataType: 'JSON',
                      data: { balance: calculated_charged_amount },
                      success: function (res) {
                        $("#pay-modal-amount").html("<b>" + calculated_charged_amount + "kr</b>" + " have been added to your balance.");
                        $("#payment-confirmation").modal('show');
                      }
                    });
                  }
                }
              }
            });
          });
        });
        mobile_pay_button.addEventListener('click', function (event) {
          instance.requestPaymentMethod(function (err, payload) {
            if (err) {
              console.log('Request Payment Method Error', err);
              return;
            }
            var pay_info = {
              currency: currency,
              payment_method_nonce: payload.nonce,
              amount: selected_cost,
              checked: $("#save-card").not(':checked').length > 0,
              customerId: brain_cus_id,
              cardType: payload.details.cardType
            };
            $.ajax({
              url: '/api/credit_checkout',
              headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
              },
              type: 'POST',
              dataType: 'JSON',
              data: pay_info,
              success: function (res) {
                var calculated_charged_amount = 0;
                if (res.status == 'success') {
                  var endpoint = 'live';
                  var access_key = '8c479a455a6d8a2f5cccc8ce01819269';
                  if (res.transaction.currencyIsoCode == 'USD' || res.transaction.currencyIsoCode == 'EUR') {
                    $.ajax({
                      url: 'http://apilayer.net/api/' + endpoint + '?access_key=' + access_key,
                      dataType: 'jsonp',
                      success: function (json) {
                        if (res.transaction.currencyIsoCode == 'USD') {
                          calculated_charged_amount = (res.transaction.amount * json.quotes.USDNOK).toFixed(2);
                        } else if (res.transaction.currencyIsoCode == 'EUR') {
                          calculated_charged_amount = (res.transaction.amount * json.quotes.USDNOK / json.quotes.USDEUR).toFixed(2);
                        }
                        $.ajax({
                          url: '/api/balance_manage',
                          headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                          },
                          type: 'POST',
                          dataType: 'JSON',
                          data: { balance: calculated_charged_amount },
                          success: function (res) {
                            $(".prepaid-card-left").attr('style', 'display: none;');
                            $(".mobile-wallet-payment").attr('style', 'display: none;');
                            $(".content-wrapper.member-content").attr('style', 'min-height:350px;');
                            var val = parseFloat(user.balance) + parseFloat(calculated_charged_amount);
                            $(".updated_balance").html(val + " NOK");
                            $(".mobile-step2").attr('style', 'display: flex;');
                            $(".mobile-wallet-transaction").attr('style', 'display: block;');
                          }
                        });
                      }
                    });                    
                  } else {
                    calculated_charged_amount = res.transaction.amount;
                    $.ajax({
                      url: '/api/balance_manage',
                      headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                      },
                      type: 'POST',
                      dataType: 'JSON',
                      data: { balance: calculated_charged_amount },
                      success: function (res) {
                        $(".prepaid-card-left").attr('style', 'display: none;');
                        $(".mobile-wallet-payment").attr('style', 'display: none;');
                        $(".content-wrapper.member-content").attr('style', 'min-height:350px;');
                        var val = parseFloat(user.balance) + parseFloat(calculated_charged_amount);
                        $(".updated_balance").html(val + " NOK");
                        $(".mobile-step2").attr('style', 'display: flex;');
                        $(".mobile-wallet-transaction").attr('style', 'display: block;');
                      }
                    });
                  }
                }
              }
            });
          });
        });
      });
    }
  });