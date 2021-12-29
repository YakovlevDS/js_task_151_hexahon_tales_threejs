function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}const images = {
  'In the back': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/292951/photo-41.JPG',
  'Quatro doggo': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/292951/photo-26.JPG',
  'Puppy puddle': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/292951/hot%20rod%20vic%20001.jpg',
  'In a field': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/292951/photo-1.JPG',
  'Cat caution': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/292951/img_2.jpg' };


setTimeout(() => {
  const props = {
    imageSrc: images['In the back'],
    tileSize: 20,
    scopeSize: 0.4,
    showScope: true,
    filterEnabled: true };

  const render = () => {
    ReactDOM.render( /*#__PURE__*/
    React.createElement(Shader, _extends({},
    props,
    {
      vertexShader,
      fragmentShader })),


    document.getElementById('js-app'));
  };
  setupGui(props, render);
  render();
}, 0);

const setupGui = (props, render) => {
  const gui = new dat.GUI();
  const imageSrcField = gui.add(props, 'imageSrc', images);
  const tileSizeField = gui.add(props, 'tileSize', 1, 40).step(1);
  const scopeSizeField = gui.add(props, 'scopeSize', 0.1, 2.0).step(0.05);
  const showScopeField = gui.add(props, 'showScope');
  const filterEnabledField = gui.add(props, 'filterEnabled');
  imageSrcField.onChange(() => render());
  tileSizeField.onChange(() => render());
  scopeSizeField.onChange(() => render());
  showScopeField.onChange(() => render());
  filterEnabledField.onChange(() => render());
};

const vertexShader = `

void main () {
  gl_Position = vec4(position, 1.0);
}

`;

const fragmentShader = `
${document.getElementById('noise2d').text}
${document.getElementById('hsv2rgb').text}

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uImage; 
uniform float uGridWidth;
uniform float uMagRadius;
uniform bool uShowScope;
uniform bool uFilterEnabled;

const float EPSILON = 0.01;

vec3 cubeRound (vec3 cube) {
  float rx = floor(cube.x + 0.5);
  float ry = floor(cube.y + 0.5);
  float rz = floor(cube.z + 0.5);
  float xd = abs(rx - cube.x);
  float yd = abs(ry - cube.y);
  float zd = abs(rz - cube.z);
  if (xd > yd && xd > zd) {
    rx = -ry - rz;
  } else if (yd > zd) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  return vec3(rx, ry, rz);
}

vec2 cubeToAxial (vec3 cube) {
  return cube.xz;
}

vec3 axialToCube (vec2 hex) {
  float x = hex.x;
  float z = hex.y;
  float y = -x - z;
  return vec3(x, y, z);
}

vec2 hexRound (vec2 hex) {
  return cubeToAxial(cubeRound(axialToCube(hex)));
}

vec2 pointToAxial (vec2 point) {
  float q = (sqrt(3.0) / 3.0 * point.x - 1.0 / 3.0 * point.y);
  float r = (                            2.0 / 3.0 * point.y);
  return vec2(q, r);
}

vec2 axialToPoint (vec2 axial) {
  float y = axial.y / (2.0 / 3.0);
  float x = (((1.0 / 3.0) * y) + axial.x) / (sqrt(3.0) / 3.0);
  return (vec2(x, y)) / 2.0 - 0.5;
}

vec2 pointToHex (vec2 point) {
  vec2 qr = pointToAxial(point);
  return hexRound(vec3(qr.x, qr.y, 5625463739.0).xy);
}

float circle (vec2 pos, float r) {
	return 1.0 - smoothstep(r - (r * EPSILON), r + (r * EPSILON), dot(pos, pos) * 4.0);
}

vec2 convertPoint (vec2 point) {
  vec2 pt = point.xy / uResolution.xy;
  pt = (pt * 2.0) - 1.0;
  return pt;
}

vec2 getMagPos () {
  return convertPoint(uMouse);
}

float getMag (vec2 pt, vec2 pos, float radius) {
  return circle(((pt - pos)), radius);
}

void main () {
  vec2 pt = convertPoint(gl_FragCoord.xy);
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 aspectPt = aspect * pt;
  vec2 magPos = getMagPos() * aspect;
  float magnification = getMag(aspectPt, magPos, uMagRadius);
  vec2 sample = pointToAxial(pt);
  if ((!uShowScope || magnification == 0.0) && uFilterEnabled) {
    sample = pointToHex(pt * uGridWidth) / uGridWidth;
  }
  vec3 color = texture2D(uImage, axialToPoint(sample)).rgb;
  float outline = (getMag(aspectPt, magPos, uMagRadius) - getMag(aspectPt, magPos, uMagRadius * 0.9)) / 4.0;
  if (!uShowScope) {
    outline = 0.0;
  }
  gl_FragColor = vec4(color, 1.0) + outline;
}

`;

class Shader extends React.Component {










  shouldComponentUpdate() {
    return false;
  }

  async componentDidMount() {
    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneBufferGeometry(2, 2);
    this.loader = new THREE.TextureLoader();
    const image = await new Promise(resolve => this.loader.load(this.props.imageSrc, resolve));
    image.wrapS = THREE.RepeatWrapping;
    image.wrapT = THREE.RepeatWrapping;
    this.uniforms = {
      uTime: {
        type: "f",
        value: 1 },

      uResolution: {
        type: "v2",
        value: new THREE.Vector2() },

      uMouse: {
        type: "v2",
        value: new THREE.Vector2() },

      uImage: {
        value: image },

      uGridWidth: {
        value: 0 },

      uMagRadius: {
        value: this.props.scopeSize },

      uFilterEnabled: {
        value: this.props.filterEnabled },

      uShowScope: {
        value: this.props.showScope } };


    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.props.vertexShader,
      fragmentShader: this.props.fragmentShader });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      canvas: this.canvas });

    // renderer.setPixelRatio(window.devicePixelRatio)
    this.handleWindowResize = this.onWindowResize(camera, renderer);
    this.handleWindowResize(this.props.tileSize);
    window.addEventListener('resize', () => this.handleWindowResize(this.props.tileSize), false);
    const handleCursor = e => {
      this.uniforms.uMouse.value.x = e.clientX - this.canvas.offsetLeft; // * window.devicePixelRatio
      this.uniforms.uMouse.value.y = this.canvas.height - (e.clientY - this.canvas.offsetTop); // * window.devicePixelRatio
    };
    this.canvas.onmousemove = e => handleCursor(e);
    this.canvas.ontouchstart = this.canvas.ontouchmove = e => {
      handleCursor(e.targetTouches[0]);
      e.preventDefault();
    };
    this.uniforms.uMouse.value = new THREE.Vector2(this.canvas.width / 2, this.canvas.height / 2);
    this.animate(renderer, scene, camera);
  }

  async componentWillReceiveProps(nextProps) {
    if (nextProps.imageSrc !== this.props.imageSrc) {
      const image = await new Promise(resolve => this.loader.load(nextProps.imageSrc, resolve));
      image.wrapS = THREE.RepeatWrapping;
      image.wrapT = THREE.RepeatWrapping;
      this.uniforms.uImage.value = image;
      this.handleWindowResize(nextProps.tileSize);
    } else if (nextProps.tileSize !== this.props.tileSize) {
      this.handleWindowResize(nextProps.tileSize);
    }
    if (nextProps.scopeSize !== this.props.scopeSize) {
      this.uniforms.uMagRadius.value = nextProps.scopeSize;
    }
    if (nextProps.showScope !== this.props.showScope) {
      this.uniforms.uShowScope.value = nextProps.showScope;
    }
    if (nextProps.filterEnabled !== this.props.filterEnabled) {
      this.uniforms.uFilterEnabled.value = nextProps.filterEnabled;
    }
  }

  animate(renderer, scene, camera) {
    requestAnimationFrame(() => {
      this.animate(renderer, scene, camera, this.uniforms);
    });
    this.uniforms.uTime.value += 0.05;
    renderer.render(scene, camera);
  }

  onWindowResize(camera, renderer) {
    return tileSize => {
      // const size = Math.min(window.innerWidth, window.innerHeight)
      const { image } = this.uniforms.uImage.value;
      const aspect = image.width / image.height;
      const width = renderer.domElement.parentElement.offsetHeight * aspect;
      const height = renderer.domElement.parentElement.offsetHeight;
      renderer.setSize(width, height);
      this.uniforms.uResolution.value.x = renderer.domElement.width;
      this.uniforms.uResolution.value.y = renderer.domElement.height;
      this.uniforms.uGridWidth.value = width / tileSize;
    };
  }

  render() {
    return /*#__PURE__*/(
      React.createElement("canvas", { ref: c => this.canvas = c }));

  }}_defineProperty(Shader, "propTypes", { imageSrc: PropTypes.string.isRequired, tileSize: PropTypes.number.isRequired, fragmentShader: PropTypes.string.isRequired, vertexShader: PropTypes.string.isRequired, scopeSize: PropTypes.number.isRequired, showScope: PropTypes.bool.isRequired, filterEnabled: PropTypes.bool.isRequired });