import { Center, Spinner } from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Field from '../images/Field.png';
import { getStartingPoints } from '../util/gameSpecificHelpers';
import { median } from 'mathjs';

let defaultGradient = {
    0.4: 'blue',
    0.6: 'cyan',
    0.7: 'lime',
    0.8: 'yellow',
    1.0: 'red'
};

let imageWidth = 1300;
let imageHeight = 462;

function HeatMap({ data, maxOccurances, smallScale, mediumScale, largeScale }) {
    const canvas = useRef(null);
    const circleCanvas = useRef(null); // circle brush canvas
    const gradientCanvas = useRef(null); // gradient canvas
    const circleCanvasRadius = useRef(1);
    const fieldCanvas = useRef(null);
    const gradient = useRef(null);
    const analysis = useRef([]);
    const prevWidth = useRef(window.innerWidth);
    const doResize = useRef(null);

    const [loadingHeatMap, setLoadingHeatMap] = useState(true);
    const [loadingField, setLoadingField] = useState(true);

    const calculateHeatMapScale = useCallback(() => {
        let scale;
        let screenWidth = window.innerWidth;
        if (screenWidth < 768) {
            scale = smallScale;
        } else if (screenWidth < 992) {
            scale = mediumScale;
        } else {
            scale = largeScale;
        }
        return (screenWidth / imageWidth) * scale;
    }, [smallScale, mediumScale, largeScale]);

    const calculateHeatMapCircleRadius = useCallback(() => {
        let scale;
        let screenWidth = window.innerWidth;
        if (screenWidth < 768) {
            scale = smallScale;
        } else if (screenWidth < 992) {
            scale = mediumScale;
        } else {
            scale = largeScale;
        }
        return (screenWidth / 25) * scale;
    }, [smallScale, mediumScale, largeScale]);

    function createCanvas() {
        const c = document.createElement('canvas');
        canvas.current.appendChild(c);
        return c;
    }

    // create a grayscale blurred circle image that we'll use for drawing points
    const createCircleBrushCanvas = useCallback((r, blur) => {
        circleCanvas.current = createCanvas('circleCanvas');
        /* eslint-disable prefer-const */
        let circleCanvasContext = circleCanvas.current.getContext('2d');
        /* eslint-enable prefer-const */

        const r2 = r + blur;

        circleCanvasRadius.current = r2;
        circleCanvas.current.width = circleCanvas.current.height = r2 * 2;

        circleCanvasContext.shadowOffsetX = circleCanvasContext.shadowOffsetY = r2 * 2;
        circleCanvasContext.shadowBlur = blur;
        circleCanvasContext.shadowColor = 'black';

        circleCanvasContext.beginPath();
        circleCanvasContext.arc(-r2, -r2, r, 0, Math.PI * 2, true);
        circleCanvasContext.closePath();
        circleCanvasContext.fill();
    }, []);

    // Create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
    const createGradientCanvas = useCallback((grad) => {
        gradientCanvas.current = createCanvas('gradientCanvas');
        /* eslint-disable prefer-const */
        let ctx = gradientCanvas.current.getContext('2d');
        let gradientTemp = ctx.createLinearGradient(0, 0, 0, 256);
        /* eslint-enable prefer-const */

        gradientCanvas.current.width = 1;
        gradientCanvas.current.height = 256;

        for (const i in grad) {
            gradientTemp.addColorStop(+i, grad[i]);
        }

        ctx.fillStyle = gradientTemp;
        ctx.fillRect(0, 0, 1, 256);

        gradient.current = ctx.getImageData(0, 0, 1, 256).data;
    }, []);

    const drawFieldCanvas = useCallback(() => {
        setLoadingField(true);
        const ctx = fieldCanvas.current.getContext('2d');
        let img = new Image();
        img.src = Field;
        img.onload = () => {
            let scale = calculateHeatMapScale();
            fieldCanvas.current.width = imageWidth * scale;
            fieldCanvas.current.height = imageHeight * scale;
            ctx.drawImage(img, 0, 0, imageWidth * scale, imageHeight * scale);
            setLoadingField(false);
        };
    }, [calculateHeatMapScale]);

    function arePointsCloserThanR(firstPoint, secondPoint, r) {
        if (Math.abs(firstPoint.x - secondPoint.x) > r || Math.abs(firstPoint.y - secondPoint.y) > r) {
            return false;
        }
        return Math.pow(r, 2) > Math.pow(firstPoint.x - secondPoint.x, 2) + Math.pow(firstPoint.y - secondPoint.y, 2);
    }

    const putText = useCallback(
        (data) => {
            let ctx = canvas.current.getContext('2d');
            let scale = calculateHeatMapScale();
            ctx.globalAlpha = 1;
            ctx.font = `${25 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
            ctx.lineWidth = (25 * scale) / 5;
            let xOffSet = 0 * scale;
            let yOffset = -18 * scale;
            for (const analyzedPoint of data) {
                // let totalScored = sum(analyzedPoint.lowerCargoAuto) + sum(analyzedPoint.upperCargoAuto);
                // if (totalScored + sum(analyzedPoint.missedAuto) !== 0) {
                //     let percentage = totalScored / (totalScored + sum(analyzedPoint.missedAuto));
                //     percentage = roundToWhole(percentage * 100);
                //     ctx.strokeText(`${percentage}%`, analyzedPoint.point.x + xOffSet, analyzedPoint.point.y + yOffset);
                //     ctx.fillText(`${percentage}%`, analyzedPoint.point.x + xOffSet, analyzedPoint.point.y + yOffset);
                // } else {
                //     ctx.strokeText(`N/A`, analyzedPoint.point.x + xOffSet, analyzedPoint.point.y + yOffset);
                //     ctx.fillText(`N/A`, analyzedPoint.point.x + xOffSet, analyzedPoint.point.y + yOffset);
                // }
                let bottomPoints = median(analyzedPoint.bottomConeAuto) * 3 + median(analyzedPoint.bottomCubeAuto) * 3;
                let middlePoints = median(analyzedPoint.middleConeAuto) * 4 + median(analyzedPoint.middleCubeAuto) * 4;
                let topPoints = median(analyzedPoint.topConeAuto) * 6 + median(analyzedPoint.topCubeAuto) * 6;
                let chargePoints = median(analyzedPoint.chargePoints);
                let mobilityPoints = median(analyzedPoint.crossCommunity);
                ctx.strokeText(`${bottomPoints + middlePoints + topPoints + chargePoints + mobilityPoints} pts`, analyzedPoint.point.x + xOffSet, analyzedPoint.point.y + yOffset - 5 * scale);
                ctx.fillText(`${bottomPoints + middlePoints + topPoints + chargePoints + mobilityPoints} pts`, analyzedPoint.point.x + xOffSet, analyzedPoint.point.y + yOffset - 5 * scale);
            }
            setLoadingHeatMap(false);
        },
        [calculateHeatMapScale]
    );

    const draw = useCallback(
        (minOpacity) => {
            setLoadingHeatMap(true);
            const opacity = typeof minOpacity === 'undefined' ? 0.2 : minOpacity;
            canvas.current.innerHTML = '';
            analysis.current = [];
            let scale = calculateHeatMapScale();
            canvas.current.width = imageWidth * scale;
            canvas.current.height = imageHeight * scale;
            createCircleBrushCanvas(calculateHeatMapCircleRadius(), calculateHeatMapCircleRadius() * 0.7);
            createGradientCanvas(defaultGradient);

            /* eslint-disable prefer-const */
            let ctx = canvas.current.getContext('2d');
            /* eslint-enable prefer-const */

            ctx.clearRect(0, 0, imageWidth * calculateHeatMapScale(), imageHeight * calculateHeatMapScale());
            let redOffset = { x: -1, y: 6 };
            let blueOffset = { x: 863, y: 6 };
            let modifiedData = getStartingPoints(data, calculateHeatMapScale(), redOffset, blueOffset);
            // draw a grayscale heatmap by putting a blurred circle at each data point
            for (let i = 0, len = modifiedData.length, p; i < len; i++) {
                p = modifiedData[i];
                let found = false;
                for (const analyzedPoint of analysis.current) {
                    if (arePointsCloserThanR(analyzedPoint.point, p, 25)) {
                        analyzedPoint.point = { x: (analyzedPoint.point.x + p.x) / 2, y: (analyzedPoint.point.y + p.y) / 2 };
                        analyzedPoint.bottomConeAuto.push(p.bottomConeAuto);
                        analyzedPoint.bottomCubeAuto.push(p.bottomCubeAuto);
                        analyzedPoint.middleConeAuto.push(p.middleConeAuto);
                        analyzedPoint.middleCubeAuto.push(p.middleCubeAuto);
                        analyzedPoint.topConeAuto.push(p.topConeAuto);
                        analyzedPoint.topCubeAuto.push(p.topCubeAuto);
                        analyzedPoint.chargePoints.push(p.chargePoints);
                        analyzedPoint.crossCommunity.push(p.crossCommunity);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    analysis.current.push({
                        point: { x: p.x, y: p.y },
                        bottomConeAuto: [p.bottomConeAuto],
                        bottomCubeAuto: [p.bottomCubeAuto],
                        middleConeAuto: [p.middleConeAuto],
                        middleCubeAuto: [p.middleCubeAuto],
                        topConeAuto: [p.topConeAuto],
                        topCubeAuto: [p.topCubeAuto],
                        chargePoints: [p.chargePoints],
                        crossCommunity: [p.crossCommunity]
                    });
                }
                ctx.globalAlpha = Math.min(Math.max(1 / maxOccurances, opacity), 1);
                ctx.drawImage(circleCanvas.current, p.x - circleCanvasRadius.current, p.y - circleCanvasRadius.current);
            }

            // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
            const colored = ctx.getImageData(0, 0, imageWidth * calculateHeatMapScale(), imageHeight * calculateHeatMapScale());
            colorize(colored.data, gradient.current);
            ctx.putImageData(colored, 0, 0);
            putText(analysis.current);
        },
        [calculateHeatMapCircleRadius, calculateHeatMapScale, createCircleBrushCanvas, createGradientCanvas, data, maxOccurances, putText]
    );

    function colorize(pixels, gradient) {
        for (let i = 0, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i + 3] * 4; // get gradient color from opacity value
            if (j) {
                pixels[i] = gradient[j];
                pixels[i + 1] = gradient[j + 1];
                pixels[i + 2] = gradient[j + 2];
                // if (pixels[i + 3] >= 25 && pixels[i + 3] < 127.5) {
                //     //0.05 * 255 = 12.75 and 0.05 is minOpacity
                //     // let newOpacity = pixels[i + 3] * 0.5 + pixels[i + 3];
                //     // if (newOpacity >= 255) {
                //     //     newOpacity = 255;
                //     // }
                //     pixels[i + 3] = 127.5;
                // }
                // pixels[i + 3] = 51; //modifying alpha value to make lower heat values still visible
            }
        }
    }

    useEffect(() => {
        // Create a new canvas element and append as a child it to main canvas
        prevWidth.current = window.innerWidth;
        draw();
        drawFieldCanvas();
    }, [draw, drawFieldCanvas]);

    const resizeHeatMap = useCallback(() => {
        clearTimeout(doResize.current);
        if (window.innerWidth !== prevWidth.current) {
            prevWidth.current = window.innerWidth;
            doResize.current = setTimeout(() => {
                draw();
                drawFieldCanvas();
            }, 250);
        }
    }, [draw, drawFieldCanvas]);

    useEffect(() => {
        window.addEventListener('resize', resizeHeatMap);

        return () => window.removeEventListener('resize', resizeHeatMap);
    }, [resizeHeatMap]);

    return (
        <Center className='heatmap'>
            <Spinner pos={'absolute'} zIndex={-1}></Spinner>
            <canvas width={imageWidth * calculateHeatMapScale()} height={imageHeight * calculateHeatMapScale()} style={{ zIndex: 0, display: loadingHeatMap || loadingField ? 'block' : 'none' }} />
            <canvas
                ref={fieldCanvas}
                width={imageWidth * calculateHeatMapScale()}
                height={imageHeight * calculateHeatMapScale()}
                style={{ position: 'absolute', zIndex: 0, display: loadingHeatMap || loadingField ? 'none' : 'block' }}
            />
            <canvas
                ref={canvas}
                width={imageWidth * calculateHeatMapScale()}
                height={imageHeight * calculateHeatMapScale()}
                style={{ zIndex: 0, display: loadingHeatMap || loadingField ? 'none' : 'block' }}
            />
        </Center>
    );
}

function areEqual(prevProps, nextProps) {
    if (prevProps.data.length !== nextProps.data.length) {
        return false;
    } else {
        let prevData = prevProps.data;
        let nextData = nextProps.data;
        for (let i = 0; i < prevProps.data.length; i++) {
            if (prevData[i]._id !== nextData[i]._id) {
                return false;
            }
        }
    }
    return true;
}

export default React.memo(HeatMap, areEqual);
