function isLoggedIn(req, res, next) {
    if (!res.locals.user) {
       

    
        req.flash('error_msg', 'Please login to access this page.');
        return res.redirect('/user/login');
    }
    next();
}

export default isLoggedIn;
