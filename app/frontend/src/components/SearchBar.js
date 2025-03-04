import React, { useState } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  VStack,
  Text,
  IconButton,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const SearchBar = ({ onSearchResults, onClearSearch, isLoading, setIsLoading }) => {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const toast = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Empty search',
        description: 'Please enter a search query.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/search', { query });
      
      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory((prev) => [query, ...prev].slice(0, 5));
      }
      
      // Pass results to parent
      onSearchResults(response.data);
      
    } catch (error) {
      console.error('Error searching images:', error);
      toast({
        title: 'Search failed',
        description: error.response?.data?.detail || 'Failed to search images.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClearSearch();
  };

  const handleHistoryItemClick = (item) => {
    setQuery(item);
    setTimeout(() => {
      handleSearch();
    }, 0);
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontWeight="bold" fontSize="lg">
        Search Images
      </Text>
      
      <Box>
        <Text mb={1} fontSize="sm" color="gray.600">
          Enter a prompt to find semantically similar images:
        </Text>
        
        <InputGroup>
          <Input
            placeholder="e.g., 'sunset over mountains'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            isDisabled={isLoading}
          />
          <InputRightElement width="4.5rem">
            {query ? (
              <Tooltip label="Clear search">
                <IconButton
                  h="1.75rem"
                  size="sm"
                  icon={<FaTimes />}
                  onClick={handleClear}
                  aria-label="Clear search"
                />
              </Tooltip>
            ) : null}
          </InputRightElement>
        </InputGroup>
      </Box>
      
      <Button
        colorScheme="brand"
        leftIcon={<FaSearch />}
        onClick={handleSearch}
        isLoading={isLoading}
        loadingText="Searching..."
      >
        Search
      </Button>
      
      {searchHistory.length > 0 && (
        <Box mt={2}>
          <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
            Recent Searches:
          </Text>
          
          <VStack spacing={1} align="stretch">
            {searchHistory.map((item, index) => (
              <Button
                key={index}
                size="xs"
                variant="ghost"
                justifyContent="flex-start"
                onClick={() => handleHistoryItemClick(item)}
                leftIcon={<FaSearch size="10px" />}
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {item}
              </Button>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default SearchBar; 