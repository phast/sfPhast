<?php

class InstagramAPI{

    protected
        $authorize_uri = 'https://api.instagram.com/oauth/authorize/',
        $access_token_uri = 'https://api.instagram.com/oauth/access_token/',
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
                $this->user_info = $response['user'];
                return true;
            }
        }

        return false;
    }

    public function getLikedMedias(){

        $request = curl_init();
        curl_setopt($request, CURLOPT_URL, "https://api.instagram.com/v1/users/self/media/liked?access_token={$this->access_token}");
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
        return $this->user_info['username'];
    }

}