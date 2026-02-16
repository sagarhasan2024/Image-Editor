import {
  AspectRatio as AspectRatioIcon,
  Brush as BrushIcon,
  CloudUpload as CloudUploadIcon,
  ColorLens as ColorLensIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  FilterHdr as FilterHdrIcon,
  Filter as FilterIcon,
  FilterVintage as FilterVintageIcon,
  Grain as GrainIcon,
  Height as HeightIcon,
  History as HistoryIcon,
  InvertColors as InvertColorsIcon,
  RestartAlt as RestartAltIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Slider,
  Snackbar,
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
  const [originalFile, setOriginalFile] = useState(null); // Store original file for metadata
  const previewCanvasRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [uploadDialog, setUploadDialog] = useState({ open: false, imageData: null });

  // New state for container resizing
  const [containerHeight, setContainerHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  function onSelectFile(e) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setOriginalFile(file);
      setCrop(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);

      setSnackbar({
        open: true,
        message: `Image "${file.name}" loaded successfully`,
        severity: 'success',
      });
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

  // Function to generate the final edited image as Blob/File
  const generateEditedImage = async () => {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (!image || !previewCanvas || !completedCrop) {
      throw new Error('No image or crop data available');
    }

    setIsProcessing(true);
    setUploadProgress(30);

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(completedCrop.width * scaleX, completedCrop.height * scaleY);
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Apply filters to the canvas context
    if (selectedFilter !== 'none' || Object.values(customFilters).some((v) => v !== 100 && v !== 0)) {
      // Create a temporary canvas to apply filters
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = previewCanvas.width;
      tempCanvas.height = previewCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      // Draw the preview with filters
      tempCtx.filter = getFilterStyle().filter;
      tempCtx.drawImage(previewCanvas, 0, 0);

      // Draw to offscreen canvas
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, offscreen.width, offscreen.height);
    } else {
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
    }

    setUploadProgress(60);

    // Generate blob
    const blob = await offscreen.convertToBlob({
      type: 'image/png',
      quality: 0.95,
    });

    setUploadProgress(90);

    // Create a File object from the blob
    const fileName = originalFile
      ? `edited-${originalFile.name.split('.')[0]}-${Date.now()}.png`
      : `edited-image-${Date.now()}.png`;

    const file = new File([blob], fileName, { type: 'image/png' });

    setUploadProgress(100);
    setIsProcessing(false);

    return { blob, file, url: URL.createObjectURL(blob) };
  };

  async function onDownloadCropClick() {
    try {
      const { url } = await generateEditedImage();

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = originalFile ? `edited-${originalFile.name.split('.')[0]}.png` : `cropped-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Image downloaded successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: `Error downloading image: ${error.message}`,
        severity: 'error',
      });
    }
  }

  // Upload to backend function
  const handleUploadToBackend = async () => {
    try {
      const { file } = await generateEditedImage();

      // Show upload confirmation dialog
      setUploadDialog({
        open: true,
        imageData: {
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });
    } catch (error) {
      console.error('Upload preparation error:', error);
      setSnackbar({
        open: true,
        message: `Error preparing image for upload: ${error.message}`,
        severity: 'error',
      });
    }
  };

  // Actual upload function - replace with your backend API
  const performUpload = async (file, metadata = {}) => {
    try {
      setUploadProgress(0);
      setIsProcessing(true);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append(
        'metadata',
        JSON.stringify({
          originalName: originalFile?.name,
          originalSize: originalFile?.size,
          edits: {
            scale,
            rotate,
            filter: selectedFilter,
            customFilters,
            crop: completedCrop,
            aspect,
          },
          ...metadata,
        })
      );

      // Simulate upload progress (replace with actual XMLHttpRequest for real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // TODO: Replace with your actual API endpoint
      const response = await fetch('https://your-backend-api.com/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      setUploadProgress(100);

      setSnackbar({
        open: true,
        message: 'Image uploaded successfully!',
        severity: 'success',
      });

      // Save this edit to history with upload info
      const editData = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        crop: completedCrop,
        scale,
        rotate,
        filter: selectedFilter,
        customFilters: { ...customFilters },
        aspect,
        uploaded: true,
        uploadUrl: result.url || result.imageUrl,
        fileName: file.name,
      };
      setSavedEdits([editData, ...savedEdits].slice(0, 10));

      return result;
    } catch (error) {
      console.error('Upload error:', error);
      setSnackbar({
        open: true,
        message: `Upload failed: ${error.message}`,
        severity: 'error',
      });
      throw error;
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  // Save current edit to history (local only)
  const handleSaveEdit = async () => {
    if (completedCrop && imgSrc) {
      try {
        const { url } = await generateEditedImage();

        const editData = {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          crop: completedCrop,
          scale,
          rotate,
          filter: selectedFilter,
          customFilters: { ...customFilters },
          aspect,
          preview: url,
          fileName: originalFile?.name || 'image.png',
        };

        setSavedEdits([editData, ...savedEdits].slice(0, 10));

        setSnackbar({
          open: true,
          message: 'Edit saved to history!',
          severity: 'success',
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error saving edit: ${error.message}`,
          severity: 'error',
        });
      }
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

      setSnackbar({
        open: true,
        message: 'Edit loaded successfully',
        severity: 'info',
      });
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
    setOriginalFile(null);
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCloseDialog = () => {
    setUploadDialog({ open: false, imageData: null });
    setUploadProgress(0);
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
        Advanced Image Editor with Upload
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Crop, apply filters, adjust colors, and upload to backend
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
                  {imgSrc && originalFile && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        <strong>{originalFile.name}</strong>
                        <br />
                        Size: {(originalFile.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Alert>
                  )}
                </Box>

                {/* Upload Progress */}
                {isProcessing && uploadProgress > 0 && (
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      {uploadProgress < 100 ? 'Processing...' : 'Complete!'} {uploadProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  </Box>
                )}

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
                      <Tooltip title="Save to History">
                        <IconButton color="success" onClick={handleSaveEdit} disabled={!imgSrc || !completedCrop}>
                          <HistoryIcon />
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
                    <AccordionSummary expandIcon={<HistoryIcon />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Edit History ({savedEdits.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        {savedEdits.map((edit) => (
                          <Paper
                            key={edit.id}
                            variant="outlined"
                            sx={{
                              p: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                              border: edit.uploaded ? '1px solid #4caf50' : 'none',
                            }}
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
                                  {edit.fileName} | {edit.filter} | {edit.scale}x
                                </Typography>
                                {edit.uploaded && (
                                  <Chip
                                    size="small"
                                    label="Uploaded"
                                    color="success"
                                    sx={{ mt: 0.5, height: 20, fontSize: '0.625rem' }}
                                  />
                                )}
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
            startIcon={<HistoryIcon />}
            onClick={handleSaveEdit}
            disabled={!imgSrc || !completedCrop}
            variant="outlined"
            color="info"
          >
            Save to History
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => onDownloadCropClick()}
            disabled={!imgSrc || !completedCrop || isProcessing}
            variant="outlined"
            color="secondary"
          >
            Download
          </Button>
          <Button
            startIcon={<CloudUploadIcon />}
            onClick={handleUploadToBackend}
            disabled={!imgSrc || !completedCrop || isProcessing}
            variant="contained"
            color="primary"
            sx={{ minWidth: 150 }}
          >
            {isProcessing ? 'Processing...' : 'Upload to Server'}
          </Button>
        </CardActions>
      </Card>

      {/* Upload Confirmation Dialog */}
      <Dialog open={uploadDialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Upload</DialogTitle>
        <DialogContent>
          <DialogContentText>You are about to upload this edited image to the server.</DialogContentText>
          {uploadDialog.imageData && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img
                src={uploadDialog.imageData.preview}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Name:</strong> {uploadDialog.imageData.name}
                <br />
                <strong>Size:</strong> {(uploadDialog.imageData.size / 1024).toFixed(2)} KB
                <br />
                <strong>Type:</strong> {uploadDialog.imageData.type}
              </Typography>
            </Box>
          )}
          {isProcessing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Uploading: {uploadProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              performUpload(uploadDialog.imageData.file);
              handleCloseDialog();
            }}
            variant="contained"
            color="primary"
            disabled={isProcessing}
          >
            Confirm Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Help Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Upload Features:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
            <li>
              <strong>Save to History:</strong> Store edits locally for later use
            </li>
            <li>
              <strong>Download:</strong> Save the edited image to your device
            </li>
            <li>
              <strong>Upload to Server:</strong> Send the final edited image to your backend
            </li>
            <li>
              <strong>Upload includes:</strong> Image file + edit metadata (crop, filters, rotation)
            </li>
            <li>
              <strong>Format:</strong> PNG with all filters baked into the image
            </li>
          </ul>
        </Typography>
      </Alert>
    </Box>
  );
}
