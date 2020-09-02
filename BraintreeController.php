<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Auth;
use Braintree;
use App\User;
use App\Models\ChargingTransactions;

class BraintreeController extends Controller {
  public $gateway;

  public function __construct() {
    $config = [
      'environment' => env('BRAINTREE_ENVIRONMENT', 'sandbox'),
      'merchantId' => env('BRAINTREE_MERCHANT_ID', 'gs5pvzp7fw34msdt'),
      'publicKey' => env('BRAINTREE_PUBLIC_KEY', '7kzntb2kcwfvwdbc'),
      'privateKey' => env('BRAINTREE_PRIVATE_KEY', 'b88ad25dbe8c172ca9635ea7726f1750')
    ];

    $this->gateway = new Braintree\Gateway($config);
  }

  public function create_token (Request $request) {
    $id = $request->get('id');
    if (isset($id)) {
      $token = $this->gateway->ClientToken()->generate(['customerId' => $id ]);
    } else {
      $token = $this->gateway->ClientToken()->generate();
    }
    return response()->json(['token' => $token]);
  }

  public function createCheckout(Request $request) {
    $amount = $request->get('amount');
    $nonce = $request->get('payment_method_nonce');
    $save_card = $request->get('checked');
    $customerId = $request->get('customerId');

    switch ($request->get('currency')) {
      case 'USD':
        $merchantAccountId = 'GotoConsultUSD';
        break;
      case 'NOK':
        $merchantAccountId = 'GotoConsultNOK';
        break;
      case 'EUR':
        $merchantAccountId = 'fantasylab';
        break;
    }
    
    if (isset($customerId)) {
      $result = $this->gateway->transaction()->sale([
        'amount' => $amount,
        'customerId' => $customerId,
        'paymentMethodNonce' => $nonce,
        'merchantAccountId' => $merchantAccountId,
        'options' => [
          'submitForSettlement' => true
        ]
      ]);
      
      if ($result->success) {
        $transaction = $result->transaction;
        $charging_transaction = [
          'user_id' => Auth::user()->id,
          'type' => $request->get('cardType'),
          'amount' => $amount,
          'transaction_id' => $transaction->id,
          'status' => $transaction->processorResponseText
        ];
        ChargingTransactions::create($charging_transaction);
        return response()->json(['status' => 'success', 'transaction' => $transaction]);
      } else {
        return response()->json(['status' => 'failed', 'transaction' => $result->message]);
      }
    } else {
      $result = $this->gateway->transaction()->sale([
        'amount' => $amount,
        'paymentMethodNonce' => $nonce,
        'merchantAccountId' => $merchantAccountId,
        'options' => [
          'submitForSettlement' => true
        ]
      ]);
      if ($result->success) {
        $transaction = $result->transaction;
        $charging_transaction = [
          'user_id' => Auth::user()->id,
          'type' => $request->get('cardType'),
          'amount' => $amount,
          'transaction_id' => $transaction->id,
          'status' => $transaction->processorResponseText
        ];
        ChargingTransactions::create($charging_transaction);
        if ($save_card) {
          $user = User::where('id', Auth::User()->id)->first();
          $result = $this->gateway->customer()->create([
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone
          ]);
          if ($result->success) {
            $user->brain_cus_id = $result->customer->id;
            $user->save();
          }
        }
        return response()->json(['status' => 'success', 'transaction' => $transaction]);
      } else {
        return response()->json(['status' => 'failed', 'transaction' => $result->message]);
      }
    }
  }
}
