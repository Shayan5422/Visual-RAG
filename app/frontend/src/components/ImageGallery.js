import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  SimpleGrid,
  Image,
  Text,
  Badge,
  Skeleton,
  VStack,
  Flex,
  Heading,
  Button,
  Center,
  IconButton,
  Tooltip,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FaSearch, FaEye, FaSyncAlt } from 'react-icons/fa';
import axios from 'axios';

const ImageGallery = ({ images: propImages, searchResults, onViewImage, isLoading, onImageUpdated }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pendingImages, setPendingImages] = useState(new Set());
  const refreshTimerRef = useRef(null);
  const AUTO_REFRESH_INTERVAL = 2500; // 2.5 seconds

  // Choose which images to display - search results or all images
  const displayImages = searchResults || images;

  // Check for images that are still being processed
  useEffect(() => {
    if (images) {
      const pending = new Set();
      images.forEach(img => {
        if (img.description === "Processing...") {
          pending.add(img.id);
        }
      });
      setPendingImages(pending);
    }
  }, [images]);

  // Auto-refresh logic
  useEffect(() => {
    // Set up polling interval if auto-refresh is enabled and there are pending images
    if (autoRefresh && pendingImages.size > 0 && !refreshing) {
      refreshTimerRef.current = setInterval(() => {
        handleRefresh(true);
      }, AUTO_REFRESH_INTERVAL);
    }

    // Clean up interval
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, pendingImages.size, refreshing]);

  // Load images from the server on component mount
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/images');
        const fetchedImages = response.data;
        setImages(fetchedImages);
        setLoading(false);
        
        // Check for completed images and notify the parent component
        if (onImageUpdated && propImages) {
          for (const img of fetchedImages) {
            // Find images that were processing but now have descriptions
            const propImage = propImages.find(p => p.id === img.id && p.description === "Processing...");
            if (propImage && img.description !== "Processing...") {
              onImageUpdated(img);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching images:', error);
        setLoading(false);
      }
    };

    fetchImages();
  }, [onImageUpdated, propImages]);

  // Update images when propImages changes (new uploads)
  useEffect(() => {
    if (propImages && propImages.length > 0) {
      setImages((prevImages) => {
        // Create a map of existing images by ID for quick lookup
        const imageMap = new Map(prevImages.map(img => [img.id, img]));
        
        // Update the map with new images
        propImages.forEach(img => {
          imageMap.set(img.id, img);
        });
        
        // Convert back to array and sort by uploaded_at (most recent first)
        return Array.from(imageMap.values())
          .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
      });
    }
  }, [propImages]);

  // Function to refresh all images
  const handleRefresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await axios.get('/api/images');
      const refreshedImages = response.data;
      setImages(refreshedImages);
      
      // Check for changes in processing status
      if (onImageUpdated) {
        for (const img of refreshedImages) {
          const currentImg = images.find(i => i.id === img.id);
          if (currentImg && currentImg.description === "Processing..." && img.description !== "Processing...") {
            // Notify parent that this image is now processed
            onImageUpdated(img);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing images:', error);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="md">
          {searchResults 
            ? 'Search Results' 
            : 'All Images'}
        </Heading>
        <Flex align="center" gap={3}>
          <FormControl display="flex" alignItems="center" width="auto">
            <FormLabel htmlFor="auto-refresh" mb="0" fontSize="sm" color="gray.600">
              Auto-Refresh
            </FormLabel>
            <Switch 
              id="auto-refresh"
              colorScheme="brand"
              isChecked={autoRefresh}
              onChange={toggleAutoRefresh}
            />
          </FormControl>
          <Tooltip label="Refresh gallery">
            <IconButton
              aria-label="Refresh gallery"
              icon={<FaSyncAlt />}
              isLoading={refreshing}
              onClick={() => handleRefresh(false)}
              size="sm"
              colorScheme="brand"
              variant="ghost"
            />
          </Tooltip>
        </Flex>
      </Flex>

      {pendingImages.size > 0 && autoRefresh && (
        <Box mb={4} bg="blue.50" p={2} borderRadius="md">
          <Text fontSize="sm" color="blue.600">
            {pendingImages.size} image{pendingImages.size > 1 ? 's' : ''} still processing. Auto-refreshing...
          </Text>
        </Box>
      )}

      {loading || isLoading ? (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="md" />
          ))}
        </SimpleGrid>
      ) : displayImages.length === 0 ? (
        <Center py={10} flexDirection="column" gap={4}>
          <Text color="gray.500">No images found</Text>
          {searchResults && (
            <Text fontSize="sm" color="gray.400">
              Try a different search query or upload some images
            </Text>
          )}
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {displayImages.map((image) => (
            <Box
              key={image.id}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              bg="white"
              shadow="sm"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
              position="relative"
            >
              {image.description === "Processing..." && (
                <Badge
                  colorScheme="orange"
                  position="absolute"
                  top={2}
                  left={2}
                  zIndex={1}
                  py={1}
                  px={2}
                  borderRadius="full"
                >
                  Processing...
                </Badge>
              )}
              
              <Box position="relative" height="200px" overflow="hidden">
                <Image
                  src={image.path}
                  alt={image.filename}
                  objectFit="cover"
                  w="100%"
                  h="100%"
                  fallbackSrc="https://via.placeholder.com/300?text=Loading..."
                />
                <Box 
                  position="absolute" 
                  top="0" 
                  right="0" 
                  bg="rgba(0,0,0,0.7)" 
                  p={2}
                  borderBottomLeftRadius="md"
                >
                  <Tooltip label="View details">
                    <IconButton
                      icon={<FaEye />}
                      size="sm"
                      colorScheme="whiteAlpha"
                      variant="ghost"
                      onClick={() => onViewImage(image)}
                      aria-label="View image details"
                    />
                  </Tooltip>
                </Box>

                {searchResults && (
                  <Box 
                    position="absolute" 
                    bottom="0" 
                    left="0" 
                    right="0"
                    bg="rgba(0,0,0,0.7)" 
                    p={1}
                    textAlign="center"
                  >
                    <Text color="white" fontSize="sm">
                      Match: {(image.similarity * 100).toFixed(1)}%
                    </Text>
                  </Box>
                )}
              </Box>

              <VStack p={3} align="start" spacing={1}>
                <Text fontWeight="medium" noOfLines={1}>
                  {image.filename.length > 25 
                    ? `${image.filename.substring(0, 25)}...` 
                    : image.filename}
                </Text>
                
                <Text fontSize="xs" color="gray.500">
                  {new Date(image.uploaded_at).toLocaleString()}
                </Text>
                
                <Text fontSize="sm" noOfLines={2} color="gray.600" minH="40px">
                  {image.description === "Processing..." 
                    ? <Badge colorScheme="orange">Processing...</Badge>
                    : image.description}
                </Text>
                
                <Button
                  size="sm"
                  leftIcon={<FaEye />}
                  variant="outline"
                  colorScheme="brand"
                  width="full"
                  onClick={() => onViewImage(image)}
                  mt={2}
                >
                  View Details
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default ImageGallery; 