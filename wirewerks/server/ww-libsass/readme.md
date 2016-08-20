Thoughts on processors
================

Libsass
--------
Sourcemaps works if output is not set to 'compressed' 		-- ie: minify probably destroys correct sourcemapping

Pleeease
---------
Didn't work all that well, yet should have?

PostCss
---------
Best option for the future, but more setup

Doesn't compile SASS files directly. Close but not it. 
	ie: @import "test" would need to become @import "_test" which is a huge problem for libraries. Can potentially use import
	 	plugin code to transform the paths and make everything work.
	 	
	 	Comments using '//' are not supported. Maybe with a plugin?
	 	 
Didn't seem 100% mature / bug-free


Conclusion
=======

Using libsass for local developemnt. Support sourcemaps and everything well.
Using PostCss/autoprefixer as a second pass for final output.

Switch index.html to use main_production.css for iPhone/firefox development.
