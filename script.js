const videoElem = document.getElementById("video-elem");
const canvasElem = document.getElementById("canvas-elem");
let stream, context;

const TIMER_MILLISECONDS = 100;
const MULTIPLIER = 0.5;
const SQUARE_SIDE = Math.floor(20 * Math.sqrt(MULTIPLIER));
const VID_W = Math.floor(1024 * MULTIPLIER);
const VID_H = Math.floor(720 * MULTIPLIER);

async function init(constraints) {
  try {
    //init webcam and videoElem
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElem.srcObject = stream;
    videoElem.addEventListener("loadedmetadata", () => {
      videoElem.play();
    });
    videoElem.width = VID_W;
    videoElem.height = VID_H;

    //init canvas
    context = canvasElem.getContext("2d");
    canvasElem.width = VID_W;
    canvasElem.height = VID_H;

    videoElem.addEventListener("play", () => {
      faceDetect();
    });
  } catch (err) {
    console.log(err);
  }
}

function faceDetect() {
  let fx = Math.floor(0.3 * VID_W),
    fy = Math.floor(0.2 * VID_H),
    fw = VID_W - 2 * fx,
    fh = VID_H - 2 * fy;
  timer(fx, fy, fw, fh);
}

function timer(fx, fy, fw, fh) {
  context.drawImage(videoElem, 0, 0, VID_W, VID_H);

  //face box
  context.strokeStyle = "green";
  context.strokeRect(fx, fy, fw, fh);

  let frame = context.getImageData(0, 0, VID_W, VID_H);

  for (let i = 0; i < VID_W; i += SQUARE_SIDE) {
    for (let j = 0; j < VID_H; j += SQUARE_SIDE) {
      if (
        withinBox(i, j, fx, fy, fw, fh) ||
        withinBox(i + SQUARE_SIDE, j + SQUARE_SIDE, fx, fy, fw, fh) ||
        withinBox(i, j + SQUARE_SIDE, fx, fy, fw, fh) ||
        withinBox(i + SQUARE_SIDE, j, fx, fy, fw, fh)
      ) {
        continue;
      }

      let ids = [];
      for (let ii = 0; ii < SQUARE_SIDE; ++ii) {
        for (let jj = 0; jj < SQUARE_SIDE; ++jj) {
          ids.push(getId(i + ii, j + jj, VID_W, VID_H));
        }
      }

      let avgs = [0, 0, 0, 0]; //rgba
      for (let k = 0; k < 4; k++) {
        avgs[k] = colorAverage(k, ids, frame.data);
      }

      for (let k = 0; k < 4; k++) {
        setColor(k, avgs[k], ids, frame.data);
      }
    }
  }
  context.putImageData(frame, 0, 0);

  setTimeout(faceDetect, TIMER_MILLISECONDS);
}

function setColor(k, col, ids, data) {
  if (ids.length == 0) return 0;
  for (let i = 0; i < ids.length; ++i) {
    data[ids[i] + k] = col;
  }
}

function colorAverage(k, ids, data) {
  if (ids.length == 0) return 0;
  let sum = 0;
  for (let i = 0; i < ids.length; ++i) {
    sum += data[ids[i] + k];
  }
  return sum / ids.length;
}

function getId(
  x /*0 based col num*/,
  y /*0 based row num*/,
  w /*number of pixels on width*/,
  h /*no. of pixels of height*/
) {
  let rowBeg = 4 * w * y;
  let id = rowBeg + 4 * x;
  return id;
}
function withinBox(x, y, fx, fy, fw, fh) {
  return x >= fx && x <= fx + fw && y >= fy && y <= fy + fh;
}

init({
  video: {
    width: { ideal: VID_W },
    height: { ideal: VID_H },
    facingMode: "user",
  },
});
