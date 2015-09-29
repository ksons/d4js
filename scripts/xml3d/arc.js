var d3_functor = d3.functor;

d3.xml3d.arc = function () {
    var innerRadius = d3_xml3d_arcInnerRadius,
        outerRadius = d3_xml3d_arcOuterRadius,
        cornerRadius = d3_zero,
        padRadius = d3_zero,
        startAngle = d3_xml3d_arcStartAngle,
        endAngle = d3_xml3d_arcEndAngle,
        padAngle = d3_xml3d_arcPadAngle,
        height = d3_xml3d_arcHeight,
        operator = "(position, normal, texcoord, index) = xflow.arc(innerRadius, outerRadius, startAngle, endAngle, height, steps)";

    function d3_zero() {
        return 0;
    }

    function arc() {
        return {
            innerRadius: { type: "float", value: 0 },
            outerRadius : { type: "float", value: outerRadius.apply(this, arguments) },
            startAngle: { type: "float", value: startAngle.apply(this, arguments) },
            endAngle: { type: "float", value: endAngle.apply(this, arguments)},
            height: { type: "float", value: height.apply(this, arguments)},
            steps: { type: "int", value: 16 }
        };
    }


    arc.operator = function (v) {
        if (!arguments.length) return operator;
        operator = d3_functor(v);
        return arc;
    };

     arc.height = function (v) {
        if (!arguments.length) return height;
        height = d3_functor(v);
        return arc;
    };

    arc.innerRadius = function (v) {
        if (!arguments.length) return innerRadius;
        innerRadius = d3_functor(v);
        return arc;
    };

    arc.outerRadius = function (v) {
        if (!arguments.length) return outerRadius;
        outerRadius = d3_functor(v);
        return arc;
    };

    arc.cornerRadius = function (v) {
        if (!arguments.length) return cornerRadius;
        cornerRadius = d3_functor(v);
        return arc;
    };

    arc.padRadius = function (v) {
        if (!arguments.length) return padRadius;
        padRadius = d3_functor(v);
        return arc;
    };

    arc.startAngle = function (v) {
        if (!arguments.length) return startAngle;
        startAngle = d3_functor(v);
        return arc;
    };

    arc.endAngle = function (v) {
        if (!arguments.length) return endAngle;
        endAngle = d3_functor(v);
        return arc;
    };

    arc.padAngle = function (v) {
        if (!arguments.length) return padAngle;
        padAngle = d3_functor(v);
        return arc;
    };
    console.dir(arc);

    arc.centroid = function () {
        var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
            a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - (Math.PI /2 );
        return [Math.cos(a) * r, Math.sin(a) * r];
    };

    return arc;
};

function d3_xml3d_arcHeight(d) {
    return d.height;
}


function d3_xml3d_arcInnerRadius(d) {
    return d.innerRadius;
}

function d3_xml3d_arcOuterRadius(d) {
    return d.outerRadius;
}

function d3_xml3d_arcStartAngle(d) {
    return d.startAngle;
}

function d3_xml3d_arcEndAngle(d) {
    return d.endAngle;
}

function d3_xml3d_arcPadAngle(d) {
    return d && d.padAngle;
}

// Note: similar to d3_cross2d, d3_geom_polygonInside
function d3_xml3d_arcSweep(x0, y0, x1, y1) {
    return (x0 - x1) * y0 - (y0 - y1) * x0 > 0 ? 0 : 1;
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function d3_xml3d_arcCornerTangents(p0, p1, r1, rc, cw) {
    var x01 = p0[0] - p1[0],
        y01 = p0[1] - p1[1],
        lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01),
        ox = lo * y01,
        oy = -lo * x01,
        x1 = p0[0] + ox,
        y1 = p0[1] + oy,
        x2 = p1[0] + ox,
        y2 = p1[1] + oy,
        x3 = (x1 + x2) / 2,
        y3 = (y1 + y2) / 2,
        dx = x2 - x1,
        dy = y2 - y1,
        d2 = dx * dx + dy * dy,
        r = r1 - rc,
        D = x1 * y2 - x2 * y1,
        d = (dy < 0 ? -1 : 1) * Math.sqrt(r * r * d2 - D * D),
        cx0 = (D * dy - dx * d) / d2,
        cy0 = (-D * dx - dy * d) / d2,
        cx1 = (D * dy + dx * d) / d2,
        cy1 = (-D * dx + dy * d) / d2,
        dx0 = cx0 - x3,
        dy0 = cy0 - y3,
        dx1 = cx1 - x3,
        dy1 = cy1 - y3;

    // Pick the closer of the two intersection points.
    // TODO Is there a faster way to determine which intersection to use?
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

    return [
        [cx0 - ox, cy0 - oy],
        [cx0 * r1 / r, cy0 * r1 / r]
    ];
}


Xflow.registerOperator("xflow.arc", {
    outputs: [{type: 'float3', name: 'position', customAlloc: true},
        {type: 'float3', name: 'normal', customAlloc: true},
        {type: 'float2', name: 'texcoord', customAlloc: true},
        {type: 'int', name: 'index', customAlloc: true}],
    params: [
        {type: 'float', source: 'innerRadius', array: true},
        {type: 'float', source: 'outerRadius', array: true},
        {type: 'float', source: 'startAngle', array: true},
        {type: 'float', source: 'endAngle', array: true},
        {type: 'float', source: 'height', array: true},
        {type: 'int', source: 'steps', array: true}

    ],
    alloc: function (sizes, innerRadius, outerRadius, startAngle, endAngle, height, steps) {
        var s = steps[0];
        if (height[0] > 0) {
            var vertexCount = 2 * s + 4 + 8 /* sides */ + 2 * s + 2;
            var indexCount = 6 * s + 12 /* sides */ + 6 * s;
        } else {
            vertexCount = s + 2;
            indexCount = s * 3;
        }
        console.log(indexCount);
        sizes['index'] = indexCount;
        sizes['position'] = vertexCount;
        sizes['normal'] = vertexCount;
        sizes['texcoord'] = vertexCount;

    },
    evaluate: function (position, normal, texcoord, index, innerRadius, outerRadius, startAngle, endAngle, height, steps) {
        var s = steps[0] || 8;
        //console.log(arguments)

        var add = function (arr, offset) {
            var pos = 0;
            for (var i = 2; i < arguments.length; i++, pos++) {
                arr[offset + pos] = arguments[i];
            }
        };


        function cap(start, indexOffset, height, bottom) {
            var i, v;
            var arcAngle = (endAngle[0] - startAngle[0]) / s;
            var radius = outerRadius[0];

            position[start * 3] = 0.0;
            position[start * 3 + 1] = height;
            position[start * 3 + 2] = 0.0;
            normal[start * 3] = 0;
            normal[start * 3 + 1] = bottom ? -1 : 1;
            normal[start * 3 + 2] = 0;
            texcoord[start * 2] = 0.25;
            texcoord[start * 2 + 1] = bottom ? 0.25 : 0.75;

            v = start + 1;
            var step = 0;
            for (i = v; i < v + s + 1; i++, step++) {
                var offset3 = i * 3;
                var offset2 = i * 2;
                var angle = startAngle[0] + step * arcAngle;

                add(position, offset3, radius * Math.sin(angle), height, radius * -Math.cos(angle));
                add(normal, offset3, 0, bottom ? -1 : 1, 0);
                if (bottom) {
                    add(texcoord, offset2, (1 + Math.sin(-angle)) / 4, (1 + Math.cos(-angle)) / 4);
                } else {
                    add(texcoord, offset2, (1 + Math.sin(angle)) / 4, (3 + Math.cos(angle)) / 4);
                }
            }

            for (i = start; i < start + s; i++, indexOffset++) {
                var offset = indexOffset * 3;
                index[offset] = start;
                index[offset + 1] = i + 1;
                index[offset + 2] = i + 2;
            }
        }


        function side(start, io, height, angle, flip) {
            var offset3 = start * 3;
            var offset2 = start * 2;
            var radius = outerRadius[0];
            flip = flip ? -1 : 1;

            var cosAngle = Math.cos(angle);
            var sinAngle = Math.sin(angle);

            function next() {
                offset2 += 2;
                offset3 += 3;
            }

            // Normals
            for (var i = 0; i < 4; i++) {
                var o = offset3 + i * 3;
                add(normal, o, flip * -cosAngle, 0, flip * sinAngle)
            }

            // unten spitze
            add(position, offset3, 0, 0, 0);
            add(texcoord, offset2, 1, 0.5);
            next();

            // oben spitze
            add(position, offset3, 0, height, 0);
            add(texcoord, offset2, 1, 1);
            next();

            // unten aussen
            add(position, offset3, radius * sinAngle, 0, radius * -cosAngle);
            add(texcoord, offset2, 0.5, 0.5);
            next();

            // oben aussen
            add(position, offset3, radius * sinAngle, height, radius * -cosAngle);
            add(texcoord, offset2, 0.5, 1.0);

            add(index, io, start, start + 1, start + 3);
            add(index, io + 3, start, start + 2, start + 3)
        }

        function back(start, io, height, radius, startAngle, endAngle) {
            var arcAngle = (endAngle - startAngle) / s;
            var i, off, off2;

            var offset3 = start * 3;
            var offset2 = start * 2;


            for (i = 0; i < s + 1; i++) {
                var angle = startAngle + i * arcAngle;
                off = offset3 + i * 6;
                off2 = offset2 + i * 4;
                var u = ((((s - i) * arcAngle) / (2 * Math.PI)));
                u = (0.5 * u) + 0.5;

                add(position, off, radius * Math.sin(angle), 0, radius * -Math.cos(angle));
                add(position, off + 3, radius * Math.sin(angle), height, radius * -Math.cos(angle));
                add(normal, off, Math.sin(angle), 0, -Math.cos(angle));
                add(normal, off + 3, Math.sin(angle), 0, -Math.cos(angle));
                add(texcoord, off2, u, 0);
                add(texcoord, off2 + 2, u, 0.5);
            }

            for (i = 0; i < s; i++) {
                var va = start + i * 2;
                off = io + 6 * i;
                add(index, off, va, va + 1, va + 3);
                add(index, off + 3, va, va + 2, va + 3);
            }
        }

        // Create Positions
        cap(0, 0, 0, true);
        if (height[0] > 0) {
            cap(s + 2, s, height[0], false);
            side(2 * s + 4, s * 6, height[0], startAngle[0]);
            side(2 * s + 8, s * 6 + 6, height[0], endAngle[0], true);
            back(2 * s + 4 + 8, 6 * s + 12, height, outerRadius[0], startAngle[0], endAngle[0])
        }
    }
});

/**
 * Wave Transformation
 */
Xflow.registerOperator("xflow.mywave", {
    outputs: [{type: 'float3', name: 'position'},
        {type: 'float3', name: 'normal'}],
    params: [{type: 'float3', source: 'position'},
        {type: 'float3', source: 'normal'},
        {type: 'float', source: 'strength'},
        {type: 'float', source: 'wavelength'},
        {type: 'float', source: 'phase'}],
    evaluate: function (newpos, newnormal, position, normal, strength, wavelength, phase, info) {

        for (var i = 0; i < info.iterateCount; i++) {
            var offset = i * 3;
            var dist = Math.sqrt(position[offset] * position[offset] + position[offset + 2] * position[offset + 2]);
            newpos[offset] = position[offset];
            newpos[offset + 1] = Math.sin(wavelength[0] * dist - phase[0]) * strength[0];
            newpos[offset + 2] = position[offset + 2];


            var tmp = Math.cos(wavelength[0] * dist - phase[0]) * wavelength[0] * strength[0];
            var dx = position[offset] / dist * tmp;
            var dz = position[offset + 2] / dist * tmp;

            var v = XML3D.math.vec3.create();
            v[0] = dx;
            v[1] = 1;
            v[2] = dz;
            XML3D.math.vec3.normalize(v, v);
            newnormal[offset] = v[0];
            newnormal[offset + 1] = v[1];
            newnormal[offset + 2] = v[2];
        }
    }
});
