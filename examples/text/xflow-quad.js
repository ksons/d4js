var XML3D = XML3D || {};

(function() {


Xflow.registerOperator("xflow.quads2triangles", {
    outputs: [
		{type: 'int', name: 'index', customAlloc: true}
	],
	
    params:  [
		{type: 'float3', source: 'position'}
    ],
	
    alloc: function(sizes, position)
    {
		var v = position.length / 3;
		var q = v / 4;
		sizes['index'] = 6*q;
	},
	
    evaluate: function(index, position)
	{
		var v = position.length / 3;
		var q = v / 4;
		var offi = 0;

		for (var offv = 0; offv < v; offv += 4)
		{
			index[offi++] = offv+3;
			index[offi++] = offv+1;
			index[offi++] = offv+0;

			index[offi++] = offv+0;
			index[offi++] = offv+2;
			index[offi++] = offv+3;
		}
		
        return true;
    }
});


})();
