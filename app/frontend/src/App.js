import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  VStack,
  Heading,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageGallery from './components/ImageGallery';
import SearchBar from './components/SearchBar';
import ImageDetailModal from './components/ImageDetailModal';

function App() {
  const [images, setImages] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fetch all images on component mount
  useEffect(() => {
    fetchImages();
  }, []);

  // Function to fetch images from server
  const fetchImages = useCallback(async () => {
    try {
      const response = await axios.get('/api/images');
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Failed to load images',
        description: 'Could not load images from server.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Function to handle new image uploaded
  const handleImageUploaded = (newImage) => {
    setImages((prevImages) => [newImage, ...prevImages]);
    toast({
      title: 'Image uploaded successfully',
      description: 'Your image is being processed for semantic search...',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  // Function to view image details
  const handleViewImage = (image) => {
    setSelectedImage(image);
    onOpen();
  };

  // Function to update a specific image after processing
  const handleImageUpdated = (updatedImage) => {
    setImages(prevImages => 
      prevImages.map(img => 
        img.id === updatedImage.id ? updatedImage : img
      )
    );
    
    // If the updated image is currently selected in the modal, update it there too
    if (selectedImage && selectedImage.id === updatedImage.id) {
      setSelectedImage(updatedImage);
    }
  };

  // Function to handle search results
  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  // Function to clear search results
  const handleClearSearch = () => {
    setSearchResults(null);
  };

  // Close the modal and reset selected image
  const handleCloseModal = () => {
    onClose();
    setTimeout(() => setSelectedImage(null), 200);
  };

  return (
    <Box minH="100vh">
      <Header />
      
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          <Box textAlign="center" mb={6}>
            <Heading as="h1" size="2xl" mb={2} color="brand.600">
              Visual RAG Photo Gallery
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Upload images, get AI-powered descriptions, and search your gallery semantically
            </Text>
          </Box>

          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between"
            gap={4}
          >
            <Box 
              w={{ base: 'full', md: '300px' }} 
              bg="white" 
              p={4} 
              borderRadius="md" 
              boxShadow="base"
            >
              <ImageUploader onImageUploaded={handleImageUploaded} />
              <Box mt={8}>
                <SearchBar 
                  onSearchResults={handleSearchResults} 
                  onClearSearch={handleClearSearch}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </Box>
            </Box>
            
            <Box 
              flex="1" 
              bg="white" 
              p={4} 
              borderRadius="md" 
              boxShadow="base"
              minH="500px"
            >
              <ImageGallery 
                images={images} 
                searchResults={searchResults}
                onViewImage={handleViewImage}
                isLoading={isLoading}
                onImageUpdated={handleImageUpdated}
              />
            </Box>
          </Flex>
        </VStack>
      </Container>

      {selectedImage && (
        <ImageDetailModal 
          isOpen={isOpen} 
          onClose={handleCloseModal} 
          image={selectedImage} 
        />
      )}
    </Box>
  );
}

export default App; 