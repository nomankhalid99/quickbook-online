import {refreshAccessToken} from "../utils/refreshToken.js"

const auth = async (req, res, next) => {
    console.log(req.cookies);
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    const tokenExpiresAt = parseInt(req.cookies.tokenExpiresAt, 10);
  
    try {
      if (accessToken) {
        // Check if we need to refresh the access token
        if (Date.now() >= tokenExpiresAt - 60000) {
          console.log('Access token is about to expire or has expired. Refreshing...');
          await refreshAccessToken(req, res);
          res.redirect('http://localhost:5173/upload');
        }else{
            res.redirect('http://localhost:5173/upload');
        }
      } else {
        console.log('Access token not found. Redirecting to authorization...');
        // return res.redirect('/authorize');
        next()
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
  export {
    auth
  }