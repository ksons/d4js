var XML3D = XML3D || {};
var Xflow = Xflow || {};

(function() {

/* 
 * signed distance fields generation in javascript
 * uses the 8SSEDT algorithm for linear-time processing
 *
 * done in conjustion with the signed distance fields text experiment
 *
 * references:
 *	http://www.lems.brown.edu/vision/people/leymarie/Refs/CompVision/DT/DTpaper.pdf
 *	http://www.codersnotes.com/notes/signed-distance-fields
 *	http://guides4it.com/Mobile/iphone-3d-programming---crisper-text-with-distance-fields-(part-1)---generating-distance-fields-with-python.aspx
 *	
 * http://github.com/zz85
 * http://twitter.com/blurspline
 * 29 April 2012
 *
 */

function signed_distance_fields( in_img_acc, out_img_acc, width, height ) {

	var x, y;
  	var grid1 = new Float32Array(2*width*height);
  	var grid2 = new Float32Array(2*width*height);
  	var cell, index;
	
	var vec2 = XML3D.math.vec2;

  	var outside = 10000;
  	var outofrange = new vec2.fromValues(outside, outside);
	var other = new vec2.create();

  	// some functions

	function grid_get(grid, x, y) {
		if (x<0 || y<0 || x> (width-1) || y> (height-1) )  {
			return outofrange;
		}
		var idx = 2 * ( y * width + x );
		return vec2.fromValues(grid[idx], grid[idx+1]);
	}

	function grid_put(grid, x, y, p) {
		var idx = 2 * ( y * width + x );
		grid[idx  ] = p[0];
		grid[idx+1] = p[1];
	}

	function grid_compare(g, cell, x, y, offsetX, offsetY) {
		vec2.copy(other, grid_get(g, x + offsetX, y+offsetY) );

		other[0] += offsetX;
		other[1] += offsetY;

		if (vec2.sqrLen(other) < vec2.sqrLen(cell)) {
			vec2.copy(cell, other);
		}

		return cell;
	}


	function propagate(grid) {
		var p;

		// pass 0
		for (y=0; y<height; y++) {

			for (x=0; x<width; x++) {
				p = grid_get(grid, x, y);
				p = grid_compare( grid, p, x, y, -1,  0 );
				p = grid_compare( grid, p, x, y,  0, -1 );
				p = grid_compare( grid, p, x, y, -1, -1 );
				p = grid_compare( grid, p, x, y,  1, -1 );
				grid_put( grid, x, y, p );
			}

			for (x=width-1;x>=0;x--) {
				p = grid_get(grid, x, y);
				p = grid_compare( grid, p, x, y, 1,  0 );
				grid_put( grid, x, y, p);
			}

		}

		// pass 1
		for (y=height-1; y>=0; y--) {
			for (x=width-1;x>=0;x--) {
				p = grid_get(grid, x, y);
				p = grid_compare( grid, p, x, y,  1,  0 );
				p = grid_compare( grid, p, x, y,  0,  1 );
				p = grid_compare( grid, p, x, y, -1,  1 );
				p = grid_compare( grid, p, x, y,  1,  1 );

				grid_put( grid, x, y, p);
			}

			for (x=0; x<width; x++) {
				p = grid_get(grid, x, y);
				p = grid_compare( grid, p, x, y, -1,  0 );
				grid_put( grid, x, y, p);
			}

		}

	}
	
	function debug_grid(grid) {
		var count = 0;
		for (var i=0; i<grid.length; i++)
			count += grid[i] != 0 ? 1 : 0;
		console.log("grid: " + count);
	}

	// Start the work

	// step 1 generate grids.
	for (y=0; y<height; y++) {
		for (x=0; x<width; x++) {

			if ( in_img_acc(x, y) ) {	
				grid_put(grid1, x, y, vec2.fromValues(0, 0));
				grid_put(grid2, x, y, vec2.fromValues(outside, outside));
			} else {
				grid_put(grid1, x, y, vec2.fromValues(outside, outside));
				grid_put(grid2, x, y, vec2.fromValues(0, 0));
			}

		}

	}
	
	// debug_grid(grid1);
	// console.log(grid1);
	// debug_grid(grid2);
	// console.log(grid2);
	

	// step 2 propagate distances
	propagate(grid1);
	propagate(grid2);

	// console.log('grid1', JSON.stringify(grid1), 'grid2', JSON.stringify(grid2));
	// debug_grid(grid1);
	// console.log(grid1);
	// debug_grid(grid2);
	// console.log(grid2);

	// var distanceFields = [];
	var dist1, dist2, dist;
	var min_dist = outside, max_dist = 0;
	
	for (y=0; y<height; y++) {
		for (x=0; x<width; x++) {
			
			dist1 = vec2.len( grid_get( grid1, x, y ) );
			dist2 = vec2.len( grid_get( grid2, x, y ) );
			dist = dist1 - dist2;

			min_dist = Math.min(min_dist, dist);
			max_dist = Math.max(max_dist, dist);
			
			out_img_acc(x, y, dist);
		}
	}

	console.log(min_dist + " - " + max_dist);
	// console.log('distanceFields', distanceFields);

	// return distanceFields;

};



Xflow.registerOperator("xflow.distancefield", {
    outputs: [
		{type: 'texture', name: 'result', customAlloc: true}
	],
	
    params:  [
		{type: 'texture', source: 'image'}
    ],
	
    alloc: function(sizes, image)
    {
        var samplerConfig = new Xflow.SamplerConfig;
        samplerConfig.setDefaults();
        // samplerConfig.minFilter = Xflow.constants.TEX_FILTER_TYPE.LINEAR;
        // samplerConfig.magFilter = Xflow.constants.TEX_FILTER_TYPE.LINEAR;
		sizes['result'] = {
			imageFormat : {
				width: image.width,
				height: image.height //,
                // texelType: Xflow.constants.TEXTURE_TYPE.FLOAT,
                // texelFormat: Xflow.constants.TEXTURE_FORMAT.ALPHA
			},
			samplerConfig : samplerConfig
		};
	},
	
    evaluate: function(result, image)
	{
		var w = image.width;
		var h = image.height;

		var d_in = image.data;
		var in_img_acc = function(x, y) {
			return d_in[4*(y*w+x)+3] > 127;
		}
		
		var d_out = result.data;
		var out_img_acc = function(x, y, val) {
			var idx = 4*(y*w+x);
			var v = Math.max(Math.min(192 - 20*val, 255), 0);
			d_out[idx  ] = v;
			d_out[idx+1] = v;
			d_out[idx+2] = v;
			d_out[idx+3] = 255;
		}
		
		signed_distance_fields(in_img_acc, out_img_acc, w, h);
		
		// console.log(d_out);
		// console.log(w + " " + h);
		
        return true;
    }
});


})();
