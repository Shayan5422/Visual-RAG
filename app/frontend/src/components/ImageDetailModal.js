import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Image,
  Text,
  Box,
  Badge,
  Flex,
  Divider,
  IconButton,
  useClipboard,
  Spinner,
} from '@chakra-ui/react';
import { FaClipboard, FaCheck, FaSyncAlt } from 'react-icons/fa';
import axios from 'axios';

const ImageDetailModal = ({ isOpen, onClose, image }) => {
  const [currentImage, setCurrentImage] = useState(image);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimerRef = useRef(null);
  const { hasCopied, onCopy } = useClipboard(currentImage?.description || '');

  // Auto-refresh the image details if it's still processing
  useEffect(() => {
    // Set image when prop changes
    setCurrentImage(image);
    
    // Setup auto-refresh for processing images
    if (isOpen && image && image.description === "Processing..." && autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        refreshImageDetails();
      }, 2000);
    }
    
    // Cleanup interval
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isOpen, image, autoRefresh]);

  // Function to get the latest image details
  const refreshImageDetails = async () => {
    if (!currentImage || !currentImage.id) return;
    
    try {
      setIsRefreshing(true);
      const response = await axios.get('/api/images');
      const images = response.data;
      
      // Find the current image in the updated data
      const updatedImage = images.find(img => img.id === currentImage.id);
      
      if (updatedImage) {
        setCurrentImage(updatedImage);
        
        // If the image is no longer processing, stop the auto-refresh
        if (updatedImage.description !== "Processing..." && refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error refreshing image details:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!currentImage) return null;

  const isProcessing = currentImage.description === "Processing...";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Image Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box position="relative" mb={4}>
            <Image
              src={currentImage.path}
              alt={currentImage.filename}
              borderRadius="md"
              objectFit="contain"
              maxH="400px"
              w="100%"
              fallbackSrc="https://via.placeholder.com/500?text=Loading..."
            />
            
            {isProcessing && (
              <Flex 
                position="absolute" 
                top={0} 
                left={0} 
                right={0} 
                bottom={0} 
                justify="center" 
                align="center"
                bg="rgba(0,0,0,0.1)"
                borderRadius="md"
              >
                <Badge colorScheme="orange" p={2} bg="white" boxShadow="md">
                  Processing image...
                </Badge>
              </Flex>
            )}
          </Box>
          
          <Box mb={4}>
            <Text fontWeight="bold" mb={1}>Filename</Text>
            <Text color="gray.700">{currentImage.filename}</Text>
          </Box>
          
          <Box mb={4}>
            <Text fontWeight="bold" mb={1}>Uploaded</Text>
            <Text color="gray.700">
              {new Date(currentImage.uploaded_at).toLocaleString()}
            </Text>
          </Box>
          
          <Divider my={4} />
          
          <Box mb={4}>
            <Flex justify="space-between" align="center" mb={1}>
              <Text fontWeight="bold">AI-Generated Description</Text>
              <Flex gap={2}>
                {isProcessing && (
                  <IconButton
                    icon={<FaSyncAlt />}
                    size="sm"
                    onClick={refreshImageDetails}
                    isLoading={isRefreshing}
                    aria-label="Refresh image details"
                    colorScheme="blue"
                  />
                )}
                <IconButton
                  icon={hasCopied ? <FaCheck /> : <FaClipboard />}
                  size="sm"
                  onClick={onCopy}
                  aria-label="Copy description"
                  colorScheme={hasCopied ? "green" : "gray"}
                  isDisabled={isProcessing}
                />
              </Flex>
            </Flex>
            
            {isProcessing ? (
              <Flex 
                bg="gray.50" 
                p={4} 
                borderRadius="md" 
                justify="center" 
                align="center"
                direction="column"
                gap={3}
              >
                <Spinner size="md" color="orange.500" />
                <Text color="orange.500" fontWeight="medium">
                  AI is analyzing your image...
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {autoRefresh 
                    ? "Results will appear automatically when ready" 
                    : "Refresh to check progress"}
                </Text>
              </Flex>
            ) : (
              <Box 
                bg="gray.50" 
                p={3} 
                borderRadius="md" 
                fontStyle="italic"
                color="gray.700"
                position="relative"
              >
                <Text>{currentImage.description}</Text>
              </Box>
            )}
          </Box>
          
          {currentImage.similarity !== undefined && (
            <Box mb={4}>
              <Text fontWeight="bold" mb={1}>Similarity Score</Text>
              <Badge colorScheme="green" p={2} borderRadius="md">
                {(currentImage.similarity * 100).toFixed(1)}% match to your query
              </Badge>
            </Box>
          )}
          
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme={isProcessing ? "orange" : "brand"} 
            mr={3} 
            onClick={isProcessing ? refreshImageDetails : onClose}
            leftIcon={isProcessing ? <FaSyncAlt /> : undefined}
            isLoading={isRefreshing}
          >
            {isProcessing ? "Refresh" : "Close"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImageDetailModal; 