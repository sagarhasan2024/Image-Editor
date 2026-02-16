import {
  AspectRatio as AspectRatioIcon,
  Brush as BrushIcon,
  ColorLens as ColorLensIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FilterHdr as FilterHdrIcon,
  Filter as FilterIcon,
  FilterVintage as FilterVintageIcon,
  Grain as GrainIcon,
  Height as HeightIcon,
  InvertColors as InvertColorsIcon,
  RestartAlt as RestartAltIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Save as SaveIcon,
  Tune as TuneIcon,
  Upload as UploadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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

// Filter presets
const FILTERS = [
  {
    name: 'Normal',
    value: 'none',
    icon: <TuneIcon />,
    style: {},
  },
  {
    name: 'Grayscale',
    value: 'grayscale',
    icon: <InvertColorsIcon />,
    style: { filter: 'grayscale(100%)' },
  },
  {
    name: 'Sepia',
    value: 'sepia',
    icon: <FilterVintageIcon />,
    style: { filter: 'sepia(100%)' },
  },
  {
    name: 'Blur',
    value: 'blur',
    icon: <GrainIcon />,
    style: { filter: 'blur(2px)' },
  },
  {
    name: 'Bright',
    value: 'brightness',
    icon: <BrushIcon />,
    style: { filter: 'brightness(150%)' },
  },
  {
    name: 'Contrast',
    value: 'contrast',
    icon: <FilterHdrIcon />,
    style: { filter: 'contrast(200%)' },
  },
  {
    name: 'Warm',
    value: 'warm',
    icon: <ColorLensIcon />,
    style: { filter: 'sepia(50%) hue-rotate(15deg)' },
  },
  {
    name: 'Cool',
    value: 'cool',
    icon: <ColorLensIcon sx={{ color: 'blue' }} />,
    style: { filter: 'hue-rotate(180deg) saturate(150%)' },
  },
  {
    name: 'Vintage',
    value: 'vintage',
    icon: <FilterIcon />,
    style: { filter: 'sepia(50%) contrast(120%) brightness(110%)' },
  },
  {
    name: 'Cinematic',
    value: 'cinematic',
    icon: <FilterIcon />,
    style: { filter: 'contrast(120%) saturate(120%) brightness(90%)' },
  },
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
  const [savedEdits, setSavedEdits] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [customFilters, setCustomFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hue: 0,
  });

  // New state for container resizing
  const [containerHeight, setContainerHeight] = useState(400);
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

  // Function to apply filter to image
  const getFilterStyle = () => {
    if (selectedFilter === 'none') {
      return {
        filter: `
          brightness(${customFilters.brightness}%)
          contrast(${customFilters.contrast}%)
          saturate(${customFilters.saturation}%)
          blur(${customFilters.blur}px)
          hue-rotate(${customFilters.hue}deg)
        `,
      };
    }

    const filter = FILTERS.find((f) => f.value === selectedFilter);
    return filter?.style || {};
  };

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

  // Save current edit to history
  const handleSaveEdit = () => {
    if (completedCrop && imgSrc) {
      const editData = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        crop: completedCrop,
        scale,
        rotate,
        filter: selectedFilter,
        customFilters: { ...customFilters },
        aspect,
        preview: previewCanvasRef.current?.toDataURL(),
      };
      setSavedEdits([editData, ...savedEdits].slice(0, 10)); // Keep last 10 edits

      // Show success message
      alert('Edit saved to history!');
    }
  };

  // Load saved edit
  const handleLoadEdit = (edit) => {
    if (edit) {
      setScale(edit.scale);
      setRotate(edit.rotate);
      setSelectedFilter(edit.filter);
      setCustomFilters(edit.customFilters);
      setAspect(edit.aspect);

      // Update crop if possible
      if (imgRef.current && edit.crop) {
        setCompletedCrop(edit.crop);
      }
    }
  };

  // Apply filter and intensity
  const handleFilterChange = (filterValue) => {
    setSelectedFilter(filterValue);
    if (filterValue !== 'none') {
      setFilterIntensity(100);
    }
  };

  // Reset all filters and adjustments
  const handleResetFilters = () => {
    setSelectedFilter('none');
    setFilterIntensity(100);
    setCustomFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hue: 0,
    });
  };

  useDebounceEffect(
    async () => {
      if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
        canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop, scale, rotate);
      }
    },
    100,
    [completedCrop, scale, rotate, selectedFilter, filterIntensity, customFilters]
  );

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    setAspect(undefined);
    setCrop(null);
    setCompletedCrop(null);
    setContainerHeight(400);
    handleResetFilters();
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
        const newHeight = Math.max(200, Math.min(800, startHeight + deltaY));
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

  const handleContainerHeightChange = (value) => {
    setContainerHeight(Math.max(200, Math.min(800, value)));
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
        Advanced Image Editor with Filters
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Crop, apply filters, adjust colors, and save your edits
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
                      <Tooltip title="Filters">
                        <IconButton
                          color={showFilters ? 'secondary' : 'primary'}
                          onClick={() => setShowFilters(!showFilters)}
                          disabled={!imgSrc}
                        >
                          <FilterIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Save Edit">
                        <IconButton color="success" onClick={handleSaveEdit} disabled={!imgSrc || !completedCrop}>
                          <SaveIcon />
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

                {/* Filters Section */}
                {showFilters && imgSrc && (
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<FilterIcon />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Image Filters
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        {/* Filter Presets */}
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Preset Filters
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {FILTERS.map((filter) => (
                              <Tooltip key={filter.name} title={filter.name}>
                                <Chip
                                  label={filter.name}
                                  onClick={() => handleFilterChange(filter.value)}
                                  color={selectedFilter === filter.value ? 'secondary' : 'default'}
                                  variant={selectedFilter === filter.value ? 'filled' : 'outlined'}
                                  icon={filter.icon}
                                  sx={{ mb: 1 }}
                                />
                              </Tooltip>
                            ))}
                          </Stack>
                        </Box>

                        {/* Filter Intensity (for preset filters) */}
                        {selectedFilter !== 'none' && (
                          <Box>
                            <Typography variant="body2" gutterBottom>
                              Filter Intensity: {filterIntensity}%
                            </Typography>
                            <Slider
                              value={filterIntensity}
                              onChange={(_, value) => setFilterIntensity(value)}
                              min={0}
                              max={200}
                              step={5}
                              marks
                              valueLabelDisplay="auto"
                            />
                          </Box>
                        )}

                        {/* Custom Filter Controls */}
                        <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
                          Custom Adjustments
                        </Typography>

                        <Box>
                          <Typography variant="caption">Brightness</Typography>
                          <Slider
                            value={customFilters.brightness}
                            onChange={(_, value) => setCustomFilters({ ...customFilters, brightness: value })}
                            min={0}
                            max={200}
                            step={5}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}%`}
                          />
                        </Box>

                        <Box>
                          <Typography variant="caption">Contrast</Typography>
                          <Slider
                            value={customFilters.contrast}
                            onChange={(_, value) => setCustomFilters({ ...customFilters, contrast: value })}
                            min={0}
                            max={200}
                            step={5}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}%`}
                          />
                        </Box>

                        <Box>
                          <Typography variant="caption">Saturation</Typography>
                          <Slider
                            value={customFilters.saturation}
                            onChange={(_, value) => setCustomFilters({ ...customFilters, saturation: value })}
                            min={0}
                            max={200}
                            step={5}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}%`}
                          />
                        </Box>

                        <Box>
                          <Typography variant="caption">Blur</Typography>
                          <Slider
                            value={customFilters.blur}
                            onChange={(_, value) => setCustomFilters({ ...customFilters, blur: value })}
                            min={0}
                            max={10}
                            step={0.5}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}px`}
                          />
                        </Box>

                        <Box>
                          <Typography variant="caption">Hue Rotation</Typography>
                          <Slider
                            value={customFilters.hue}
                            onChange={(_, value) => setCustomFilters({ ...customFilters, hue: value })}
                            min={0}
                            max={360}
                            step={15}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}°`}
                          />
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleResetFilters}
                          startIcon={<RestartAltIcon />}
                          fullWidth
                        >
                          Reset Filters
                        </Button>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Saved Edits History */}
                {savedEdits.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<SaveIcon />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Saved Edits ({savedEdits.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        {savedEdits.map((edit) => (
                          <Paper
                            key={edit.id}
                            variant="outlined"
                            sx={{ p: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                            onClick={() => handleLoadEdit(edit)}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              {edit.preview && (
                                <Box
                                  component="img"
                                  src={edit.preview}
                                  sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 0.5 }}
                                />
                              )}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" display="block">
                                  {edit.timestamp}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Filter: {edit.filter} | Scale: {edit.scale}x
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
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
                          ...getFilterStyle(),
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

                    {/* Active Filter Indicator */}
                    {selectedFilter !== 'none' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          backgroundColor: 'secondary.main',
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
                        <FilterIcon sx={{ fontSize: '0.875rem' }} />
                        {FILTERS.find((f) => f.value === selectedFilter)?.name || selectedFilter}
                      </Box>
                    )}

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
            startIcon={<SaveIcon />}
            onClick={handleSaveEdit}
            disabled={!imgSrc || !completedCrop}
            variant="outlined"
            color="success"
          >
            Save Edit
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => onDownloadCropClick()}
            disabled={!imgSrc || !completedCrop || isProcessing}
            variant="contained"
            color="primary"
            sx={{ minWidth: 150 }}
          >
            {isProcessing ? 'Processing...' : 'Download Image'}
          </Button>
        </CardActions>
      </Card>

      {/* Help Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>New Features:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            <li>
              <strong>Filters:</strong> Apply preset filters or create custom ones
            </li>
            <li>
              <strong>Save Button:</strong> Save your edits to history (click the save icon or button)
            </li>
            <li>
              <strong>Edit History:</strong> Access your last 10 saved edits from the accordion
            </li>
            <li>
              <strong>Custom Adjustments:</strong> Fine-tune brightness, contrast, saturation, and more
            </li>
            <li>
              <strong>Filter Intensity:</strong> Adjust the strength of preset filters
            </li>
          </ul>
        </Typography>
      </Alert>
    </Box>
  );
}
