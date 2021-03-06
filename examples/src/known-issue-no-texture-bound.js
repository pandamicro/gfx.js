(() => {
  let gfx = window.gfx;
  let device = window.device;
  let canvas = window.canvas;
  let resl = window.resl;
  let { quat, vec3, mat4 } = window.vmath;
  let texture = null;

  // init resources
  let program = new gfx.Program(device, {
    vert: `
      precision highp float;
      uniform mat4 transform;
      attribute vec2 a_position;
      varying vec2 v_texcoord;
      void main () {
        gl_Position = transform * vec4(a_position, 0, 1);
        v_texcoord = a_position * 0.5 + 0.5;
      }
    `,
    frag: `
      precision highp float;
      uniform sampler2D texture0;
      uniform sampler2D texture1;
      uniform vec4 color;
      varying vec2 v_texcoord;
      void main () {
        gl_FragColor = texture2D(texture0, v_texcoord) * v_texcoord.x + texture2D(texture1, v_texcoord) * (1.0 - v_texcoord.x);
      }
    `,
  });
  program.link();
  let canvasElement = document.createElement('canvas');
  canvasElement.width = 512;
  canvasElement.height = 512;
  let ctx = canvasElement.getContext('2d');
  ctx.fillStyle = 'rgb(255,128,0)';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillText('use canvas element as texture, filled by rgb(255,128,0)', 90, 256);
  let canvasTexture = new gfx.Texture2D(device, {
    width: 512,
    height: 512,
    images: [canvasElement]
  });

  resl({
    manifest: {
      image: {
        type: 'image',
        src: './assets/uv_checker_01.jpg'
      },
    },
    onDone(assets) {
      let image = assets.image;
      texture = new gfx.Texture2D(device, {
        width: image.width,
        height: image.height,
        images: [image]
      });
    }
  });
  let vertexFmt = new gfx.VertexFormat([
    { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
  ]);
  let vertexBuffer = new gfx.VertexBuffer(
    device,
    vertexFmt,
    gfx.USAGE_STATIC,
    new Float32Array([-1, -1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1]),
    6
  );
  let transform = mat4.create();
  mat4.fromRTS(transform, quat.create(), vec3.new(0, 0, 0), vec3.new(0.5, 0.5, 0.5));

  let cnt = 0;

  // tick
  return function tick() {
    device.setViewport(0, 0, canvas.width, canvas.height);
    device.clear({
      color: [0.1, 0.1, 0.1, 1],
      depth: 1
    });

    if (texture && canvasTexture) {
      device.setVertexBuffer(0, vertexBuffer);
      device.setUniform('color', new Float32Array([1, 0, 0, 1]));

      if (cnt % 2) {
        device.setTexture('texture0', canvasTexture, 0);
      }

      device.setTexture('texture1', texture, 1);
      device.setUniform('transform', mat4.array(new Float32Array(16), transform));
      device.setProgram(program);
      device.draw(0, vertexBuffer.count);

      ++cnt;
    }
  };
})();
