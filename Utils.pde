/*
 * General utilities
 */
public static class Utils{
  
  /*
   * We use Math.random() instead of Processing's random() to prevent
   * having to make this class a singleton and take a Papplet. That code
   * would be unnecessarily complex.
   */
  public static int getRandomInt(int minVal, int maxVal) {
    float scaleFloat = (float) Math.random();
    return minVal + (int) (scaleFloat * (maxVal - minVal + 1));
  }
  
  /*
   * This is here simply to provide a means for us to call a custom method for the JS version.
   */
  public static int charCodeAt(char ch){
    return ch;
  }
  
  /**
   * Mostly used for adding zeros to number in string format, but general enough to be
   * used for other purposes.
   */
  public static String prependStringWithString(String baseString, String prefix, int newStrLength){
    if(newStrLength <= baseString.length()){
      return baseString;
    }
    
    int zerosToAdd = newStrLength - baseString.length();
    
    for(int i = 0; i < zerosToAdd; i++){
      baseString = prefix + baseString;
    }
    
    return baseString;
  }
}
