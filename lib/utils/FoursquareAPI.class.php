<?php

class FoursquareAPI{

    protected
        $authorize_uri = 'https://foursquare.com/oauth2/authenticate',
        $access_token_uri = 'https://foursquare.com/oauth2/access_token',
        $access_token,
        $user_info,
        $client_id,
        $client_secret,
        $redirect_uri;

    public function __construct($client_id, $client_secret, $redirect_uri){
        $this->client_id =$client_id;
        $this->client_secret = $client_secret;
        $this->redirect_uri = $redirect_uri;
    }

    public function getURL(){
        $redirect_uri = urlencode($this->redirect_uri);
        return "{$this->authorize_uri}?client_id={$this->client_id}&redirect_uri={$redirect_uri}&response_type=code";
    }

    public function authorize($code){

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, $this->access_token_uri);
        curl_setopt($request, CURLOPT_HEADER, false);
        curl_setopt($request, CURLOPT_HTTPHEADER, []);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($request, CURLOPT_POST, true);
        curl_setopt($request, CURLOPT_POSTFIELDS, [
            'client_id' => $this->client_id,
            'client_secret' => $this->client_secret,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirect_uri,
            'code' => $code
        ]);

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

    public function getUser(){

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, "https://api.foursquare.com/v2/users/self?oauth_token={$this->access_token}&v=" . date('YYmmdd') . "&locale=ru");
        curl_setopt($request, CURLOPT_HEADER, false);
        curl_setopt($request, CURLOPT_HTTPHEADER, []);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);

        if($response = curl_exec($request)){
            $http_code = curl_getinfo($request, CURLINFO_HTTP_CODE);
            curl_close($request);

            if(200 === $http_code){
                $response = json_decode($response, true);
                $this->user_info = $response['response']['user'];
                return true;
            }
        }

        return false;

    }

    public function getTips(){

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, "https://api.foursquare.com/v2/users/self/tips?oauth_token={$this->access_token}&v=" . date('YYmmdd') . "&locale=ru");
        curl_setopt($request, CURLOPT_HEADER, false);
        curl_setopt($request, CURLOPT_HTTPHEADER, []);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);

        if($response = curl_exec($request)){
            $http_code = curl_getinfo($request, CURLINFO_HTTP_CODE);
            curl_close($request);

            if(200 === $http_code){
                $response = json_decode($response, true);
                return $response;
            }
        }

        return false;
    }

    public function getCheckins(){

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, "https://api.foursquare.com/v2/users/self/checkins?oauth_token={$this->access_token}&v=" . date('YYmmdd') . "&locale=ru");
        curl_setopt($request, CURLOPT_HEADER, false);
        curl_setopt($request, CURLOPT_HTTPHEADER, []);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);

        if($response = curl_exec($request)){
            $http_code = curl_getinfo($request, CURLINFO_HTTP_CODE);
            curl_close($request);

            if(200 === $http_code){
                $response = json_decode($response, true);
                return $response;
            }
        }

        return false;
    }

    public function getVenue($id){

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, "https://api.foursquare.com/v2/venues/{$id}?oauth_token={$this->access_token}&v=" . date('YYmmdd') . "&locale=ru");
        curl_setopt($request, CURLOPT_HEADER, false);
        curl_setopt($request, CURLOPT_HTTPHEADER, []);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);

        if($response = curl_exec($request)){
            $http_code = curl_getinfo($request, CURLINFO_HTTP_CODE);
            curl_close($request);

            if(200 === $http_code){
                $response = json_decode($response, true);
                return $response;
            }
        }

        return false;

    }

    public function getCategories(){

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, "https://api.foursquare.com/v2/venues/categories?oauth_token={$this->access_token}&v=" . date('YYmmdd') . "&locale=ru");
        curl_setopt($request, CURLOPT_HEADER, false);
        curl_setopt($request, CURLOPT_HTTPHEADER, []);
        curl_setopt($request, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);

        if($response = curl_exec($request)){
            $http_code = curl_getinfo($request, CURLINFO_HTTP_CODE);
            curl_close($request);

            if(200 === $http_code){
                $response = json_decode($response, true);
                return $response;
            }
        }

        return false;

    }

    public function getUsername(){
        return $this->user_info['contact']['email'];
    }

}