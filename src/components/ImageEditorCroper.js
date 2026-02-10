import {
  AspectRatio as AspectRatioIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Height as HeightIcon,
  RestartAlt as RestartAltIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Upload as UploadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview } from '../common/canvasPreview';
import { useDebounceEffect } from '../common/useDebounceEffect';

// Helper functions
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

// Aspect ratio presets
const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
];

export default function ImageEditorCropper() {
  const [imgSrc, setImgSrc] = useState(null);
  const previewCanvasRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  // New state for container resizing
  const [containerHeight, setContainerHeight] = useState(400); // Initial height in px
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  function onSelectFile(e) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  async function onDownloadCropClick() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error('Crop canvas does not exist');
    }

    setIsProcessing(true);

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(completedCrop.width * scaleX, completedCrop.height * scaleY);
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height
    );

    const blob = await offscreen.convertToBlob({
      type: 'image/png',
      quality: 0.95,
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cropped-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsProcessing(false);
  }

  useDebounceEffect(
    async () => {
      if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
        canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop, scale, rotate);
      }
    },
    100,
    [completedCrop, scale, rotate]
  );

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    setAspect(undefined);
    setCrop(null);
    setCompletedCrop(null);
    setContainerHeight(400); // Reset container height
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearImage = () => {
    setImgSrc(null);
    handleReset();
  };

  const handleAspectRatioChange = (ratio) => {
    setAspect(ratio);
    if (ratio && imgRef.current) {
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, ratio);
      setCrop(newCrop);
      setCompletedCrop(convertToPixelCrop(newCrop, width, height));
    }
  };

  const handleRotate = (direction) => {
    setRotate((prev) => {
      const newValue = direction === 'left' ? prev - 90 : prev + 90;
      return ((newValue + 180) % 360) - 180;
    });
  };

  const handleZoom = (direction) => {
    setScale((prev) => {
      const newValue = direction === 'in' ? prev + 0.1 : prev - 0.1;
      return Math.min(Math.max(0.1, newValue), 3);
    });
  };

  const handleSliderChange = (type, value) => {
    if (type === 'scale') {
      setScale(value);
    } else if (type === 'rotate') {
      setRotate(value);
    }
  };

  // Handle container resize with mouse
  const handleResizeStart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startY = e.clientY || e.touches[0].clientY;
      const startHeight = containerHeight;

      const handleMouseMove = (moveEvent) => {
        const currentY = moveEvent.clientY || moveEvent.touches[0].clientY;
        const deltaY = currentY - startY;
        const newHeight = Math.max(200, Math.min(800, startHeight + deltaY)); // Min 200px, Max 800px
        setContainerHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('touchend', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
    },
    [containerHeight]
  );

  // Handle container resize with slider
  const handleContainerHeightChange = (value) => {
    setContainerHeight(Math.max(200, Math.min(800, value)));
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
        Image Editor with Resizable Container
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Drag the bottom border of the image container to resize it vertically
      </Typography>

      <Card elevation={3} sx={{ mt: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Left Panel - Controls */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* File Upload */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Upload Image
                  </Typography>
                  <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth sx={{ py: 1.5 }}>
                    Choose Image
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} hidden />
                  </Button>
                  {imgSrc && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      Image loaded successfully
                    </Alert>
                  )}
                </Box>

                {/* Container Height Control */}
                {imgSrc && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Container Height: {containerHeight}px
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <HeightIcon color="action" />
                      <Slider
                        value={containerHeight}
                        onChange={(_, value) => handleContainerHeightChange(value)}
                        min={200}
                        max={800}
                        step={10}
                        disabled={!imgSrc}
                        sx={{ flex: 1 }}
                      />
                      <HeightIcon color="action" sx={{ transform: 'rotate(180deg)' }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Or drag the bottom border of the image container
                    </Typography>
                  </Box>
                )}

                {/* Quick Actions */}
                {imgSrc && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Quick Actions
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Tooltip title="Zoom In">
                        <IconButton color="primary" onClick={() => handleZoom('in')} disabled={!imgSrc || scale >= 3}>
                          <ZoomInIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Zoom Out">
                        <IconButton
                          color="primary"
                          onClick={() => handleZoom('out')}
                          disabled={!imgSrc || scale <= 0.1}
                        >
                          <ZoomOutIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rotate Left">
                        <IconButton color="primary" onClick={() => handleRotate('left')} disabled={!imgSrc}>
                          <RotateLeftIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rotate Right">
                        <IconButton color="primary" onClick={() => handleRotate('right')} disabled={!imgSrc}>
                          <RotateRightIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset All">
                        <IconButton color="error" onClick={handleReset} disabled={!imgSrc}>
                          <RestartAltIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                )}

                {/* Scale Control */}
                {imgSrc && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Scale: {scale.toFixed(1)}x
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <ZoomOutIcon color="action" />
                      <Slider
                        value={scale}
                        onChange={(_, value) => handleSliderChange('scale', value)}
                        min={0.1}
                        max={3}
                        step={0.1}
                        disabled={!imgSrc}
                        sx={{ flex: 1 }}
                      />
                      <ZoomInIcon color="action" />
                    </Stack>
                  </Box>
                )}

                {/* Rotation Control */}
                {imgSrc && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Rotation: {rotate}°
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <RotateLeftIcon color="action" />
                      <Slider
                        value={rotate}
                        onChange={(_, value) => handleSliderChange('rotate', value)}
                        min={-180}
                        max={180}
                        step={1}
                        disabled={!imgSrc}
                        sx={{ flex: 1 }}
                      />
                      <RotateRightIcon color="action" />
                    </Stack>
                  </Box>
                )}

                {/* Aspect Ratio */}
                {imgSrc && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Aspect Ratio
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {ASPECT_RATIOS.map((ratio) => (
                        <Chip
                          key={ratio.label}
                          label={ratio.label}
                          onClick={() => handleAspectRatioChange(ratio.value)}
                          color={aspect === ratio.value ? 'primary' : 'default'}
                          variant={aspect === ratio.value ? 'filled' : 'outlined'}
                          icon={ratio.label !== 'Free' && <AspectRatioIcon />}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Grid>

            {/* Right Panel - Image and Preview */}
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                {/* Main Image Editor with Resizable Container */}
                {imgSrc ? (
                  <Box
                    ref={containerRef}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                      height: `${containerHeight}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.default',
                      transition: isResizing ? 'none' : 'height 0.2s ease',
                      cursor: 'default',
                    }}
                  >
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspect}
                      minHeight={50}
                      minWidth={50}
                      keepSelection
                    >
                      <img
                        ref={imgRef}
                        alt="Edit"
                        src={imgSrc}
                        style={{
                          transform: `scale(${scale}) rotate(${rotate}deg)`,
                          maxWidth: '100%',
                          maxHeight: '100%',
                          display: 'block',
                        }}
                        onLoad={onImageLoad}
                      />
                    </ReactCrop>

                    {/* Resize Handle - Bottom Border */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '8px',
                        backgroundColor: isResizing ? 'primary.main' : 'grey.400',
                        cursor: 'ns-resize',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          backgroundColor: 'primary.main',
                        },
                        '&:active': {
                          backgroundColor: 'primary.dark',
                        },
                      }}
                      onMouseDown={handleResizeStart}
                      onTouchStart={handleResizeStart}
                    >
                      <Box
                        sx={{
                          width: '40px',
                          height: '4px',
                          backgroundColor: 'white',
                          borderRadius: '2px',
                        }}
                      />
                    </Box>

                    {/* Resize Handle Label */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <HeightIcon sx={{ fontSize: '0.875rem' }} />
                      {containerHeight}px
                    </Box>

                    {/* Resize Instructions */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                      }}
                    >
                      Drag bottom border to resize container
                    </Box>
                  </Box>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 8,
                      textAlign: 'center',
                      border: '2px dashed',
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                      height: '400px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Image Selected
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload an image to start editing
                    </Typography>
                  </Paper>
                )}

                {/* Preview Section */}
                {completedCrop && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      Cropped Preview
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Stack spacing={2} alignItems="center">
                        <Box
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'white',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <canvas
                            ref={previewCanvasRef}
                            style={{
                              display: 'block',
                              maxWidth: '100%',
                              maxHeight: '300px',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" align="center">
                          Final output: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} pixels
                        </Typography>
                      </Stack>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>

        {/* Action Buttons */}
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 2, gap: 2 }}>
          <Button
            startIcon={<DeleteIcon />}
            onClick={handleClearImage}
            disabled={!imgSrc}
            color="error"
            variant="outlined"
          >
            Clear
          </Button>
          <Button startIcon={<RestartAltIcon />} onClick={handleReset} disabled={!imgSrc} variant="outlined">
            Reset All
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => onDownloadCropClick()}
            disabled={!imgSrc || !completedCrop || isProcessing}
            variant="contained"
            color="primary"
            sx={{ minWidth: 150 }}
          >
            {isProcessing ? 'Processing...' : 'Download Cropped'}
          </Button>
        </CardActions>
      </Card>

      {/* Help Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Container Resize Features:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            <li>
              Drag the <strong>bottom border</strong> (grey/blue bar) up/down to resize container height
            </li>
            <li>Use the height slider in the controls panel for precise adjustment</li>
            <li>Works with both mouse and touch devices</li>
            <li>Container height range: 200px to 800px</li>
            <li>The crop box inside can still be resized independently</li>
          </ul>
        </Typography>
      </Alert>
    </Box>
  );
}
