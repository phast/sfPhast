<?php

class TwitterAPI{

    protected
        $access_token_uri = 'https://api.twitter.com/oauth2/token',
        $access_token,
        $client_id,
        $client_secret,
        $redirect_uri;

    public function __construct($client_id, $client_secret, $redirect_uri = ''){
        $this->client_id = $client_id;
        $this->client_secret = $client_secret;
        $this->redirect_uri = $redirect_uri;
    }

    public function authorize(){

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, $this->access_token_uri);
        curl_setopt($request, CURLOPT_HEADER, false);
        curl_setopt($request, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . base64_encode(rawurlencode($this->client_id).':'.rawurlencode($this->client_secret)),
            'Content-Type: application/x-www-form-urlencoded;charset=UTF-8',
        ]);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($request, CURLOPT_POST, 1);
        curl_setopt($request, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');

        if($response = curl_exec($request)){
            $http_code = curl_getinfo($request, CURLINFO_HTTP_CODE);
            curl_close($request);

            if(200 === $http_code){
                $response = json_decode($response, true);
                $this->access_token = $response['access_token'];
                return true;
            }
        }

        return false;
    }

    public function getStatuses($name){
        $name = rawurlencode($name);
        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, "https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name={$name}");
        curl_setopt($request, CURLOPT_HEADER, false);
        curl_setopt($request, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->access_token,
        ]);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);

        if($response = curl_exec($request)){
            $http_code = curl_getinfo($request, CURLINFO_HTTP_CODE);
            curl_close($request);

            if(200 === $http_code){
                $response = json_decode($response, true);
                return $response;
            }else{
                die($response);
            }
        }

        return false;
    }

    public function getUsername(){
        return $this->user_info['username'];
    }

}